const User = require('../models/user');
const ActivityLog = require('../models/activitylog');

const ALLOWED_CONDITIONS = ['death', 'incapacity', 'inactivity', 'courtOrder'];
const LEGAL_CONDITIONS = ['death', 'incapacity', 'courtOrder'];

function sanitizeNominee(nominee) {
  if (!nominee || !nominee.email) {
    return null;
  }

  return {
    user: nominee.user || null,
    name: nominee.name || '',
    email: nominee.email || '',
    relationship: nominee.relationship || '',
    condition: nominee.condition || null,
    status: nominee.status || 'pending',
    requestedAt: nominee.requestedAt || null,
    approvedAt: nominee.approvedAt || null,
    activatedAt: nominee.activatedAt || null,
    claim: nominee.claim?.submittedAt
      ? {
          submittedAt: nominee.claim.submittedAt,
          proofType: nominee.claim.proofType || '',
          proofNotes: nominee.claim.proofNotes || '',
          proofDocumentUrl: nominee.claim.proofDocumentUrl || '',
          proofDocumentName: nominee.claim.proofDocumentName || '',
          reviewedAt: nominee.claim.reviewedAt || null,
          activationNotes: nominee.claim.activationNotes || ''
        }
      : null
  };
}

function ensureCondition(condition) {
  if (!ALLOWED_CONDITIONS.includes(condition)) {
    const error = new Error('Nominee condition must be death, incapacity, inactivity, or courtOrder');
    error.statusCode = 400;
    throw error;
  }
}

function canReviewNominee(reqUser) {
  return reqUser.role === 'admin';
}

async function logNomineeEvent(userId, action, metadata = {}) {
  await ActivityLog.create({
    user: userId,
    action,
    metadata
  });
}

const registerNominee = async (req, res) => {
  try {
    const { name, email, relationship, condition } = req.body;
    const nomineeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!name?.trim() || !nomineeEmail || !relationship?.trim() || !condition) {
      return res.status(400).json({ success: false, message: 'Name, email, relationship, and condition are required' });
    }

    ensureCondition(condition);

    if (nomineeEmail === req.user.email) {
      return res.status(400).json({ success: false, message: 'Nominee must be a different user' });
    }

    const nomineeUser = await User.findOne({ email: nomineeEmail }).select('_id');
    const owner = await User.findById(req.user._id);

    owner.nominee = {
      user: nomineeUser?._id || null,
      name: name.trim(),
      email: nomineeEmail,
      relationship: relationship.trim(),
      condition,
      status: 'pending',
      requestedAt: new Date(),
      approvedAt: null,
      activatedAt: null,
      claim: {
        submittedAt: null,
        proofType: '',
        proofNotes: '',
        proofDocumentUrl: '',
        proofDocumentName: '',
        reviewedBy: null,
        reviewedAt: null,
        activatedBy: null,
        activationNotes: ''
      }
    };

    await owner.save();
    await logNomineeEvent(owner._id, 'NOMINEE_REGISTERED', { nomineeEmail, condition });

    return res.status(201).json({
      success: true,
      message: 'Nominee registered. They will not receive access until a claim is verified and activated.',
      data: sanitizeNominee(owner.nominee)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getNomineeStatus = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id).select('nominee');
    const nominatedBy = await User.find({
      'nominee.email': req.user.email,
      'nominee.status': { $in: ['pending', 'approved', 'active'] }
    }).select('name email nominee');

    return res.status(200).json({
      success: true,
      data: {
        nominee: sanitizeNominee(owner.nominee),
        nominatedBy: nominatedBy.map((user) => ({
          ownerId: user._id,
          ownerName: user.name,
          ownerEmail: user.email,
          nominee: sanitizeNominee(user.nominee)
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const claimNomineeAccess = async (req, res) => {
  try {
    const { ownerEmail, proofType, proofNotes } = req.body;
    const normalizedOwnerEmail = typeof ownerEmail === 'string' ? ownerEmail.trim().toLowerCase() : '';

    if (!normalizedOwnerEmail || !proofType?.trim() || !proofNotes?.trim()) {
      return res.status(400).json({ success: false, message: 'Owner email, proof type, and proof notes are required' });
    }

    const uploadedUrl = req.file?.secure_url || req.file?.path || req.file?.url || '';

    if (!uploadedUrl) {
      return res.status(400).json({ success: false, message: 'A proof document is required for nominee claims' });
    }

    const owner = await User.findOne({
      email: normalizedOwnerEmail,
      'nominee.email': req.user.email,
      'nominee.status': { $in: ['pending', 'approved'] }
    });

    if (!owner) {
      return res.status(404).json({ success: false, message: 'No pending nomination was found for this owner and nominee' });
    }

    owner.nominee.user = req.user._id;
    owner.nominee.claim = {
      ...owner.nominee.claim,
      submittedAt: new Date(),
      proofType: proofType.trim(),
      proofNotes: proofNotes.trim(),
      proofDocumentUrl: uploadedUrl,
      proofDocumentName: req.file?.originalname || req.file?.filename || 'Proof document',
      reviewedBy: null,
      reviewedAt: null,
      activatedBy: null,
      activationNotes: ''
    };

    await owner.save();
    await logNomineeEvent(req.user._id, 'NOMINEE_CLAIMED', {
      ownerId: owner._id,
      ownerEmail: owner.email,
      proofType: proofType.trim()
    });

    return res.status(200).json({
      success: true,
      message: 'Claim submitted. Access still requires verification and activation.',
      data: sanitizeNominee(owner.nominee)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const listNomineeClaims = async (req, res) => {
  try {
    if (!canReviewNominee(req.user)) {
      return res.status(403).json({ success: false, message: 'Only an admin reviewer can view nominee claims' });
    }

    const owners = await User.find({
      'nominee.claim.submittedAt': { $ne: null },
      'nominee.status': { $in: ['pending', 'approved'] }
    })
      .select('name email nominee')
      .sort({ 'nominee.claim.submittedAt': -1 });

    return res.status(200).json({
      success: true,
      data: owners.map((owner) => ({
        ownerId: owner._id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        nominee: sanitizeNominee(owner.nominee)
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveNomineeClaim = async (req, res) => {
  try {
    const { ownerEmail, ownerId } = req.body;
    const query = ownerId
      ? { _id: ownerId }
      : { email: typeof ownerEmail === 'string' ? ownerEmail.trim().toLowerCase() : '' };

    const owner = await User.findOne(query);

    if (!owner?.nominee?.email) {
      return res.status(404).json({ success: false, message: 'Nominee record not found' });
    }

    if (!canReviewNominee(req.user)) {
      return res.status(403).json({ success: false, message: 'Only an admin reviewer can approve a nominee claim' });
    }

    if (owner.nominee.email === req.user.email) {
      return res.status(403).json({ success: false, message: 'Nominees cannot approve their own claims' });
    }

    if (!owner.nominee.claim?.submittedAt) {
      return res.status(400).json({ success: false, message: 'A claim must be submitted before approval' });
    }

    if (!owner.nominee.claim.proofDocumentUrl) {
      return res.status(400).json({ success: false, message: 'A submitted proof document is required before approval' });
    }

    owner.nominee.status = 'approved';
    owner.nominee.approvedAt = new Date();
    owner.nominee.claim.reviewedBy = req.user._id;
    owner.nominee.claim.reviewedAt = new Date();

    await owner.save();
    await logNomineeEvent(req.user._id, 'NOMINEE_APPROVED', { ownerId: owner._id, nomineeEmail: owner.nominee.email });

    return res.status(200).json({
      success: true,
      message: 'Nominee claim approved. Activate only after final condition verification.',
      data: sanitizeNominee(owner.nominee)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const activateNomineeAccess = async (req, res) => {
  try {
    const { ownerEmail, ownerId, verificationNotes } = req.body;
    const query = ownerId
      ? { _id: ownerId }
      : { email: typeof ownerEmail === 'string' ? ownerEmail.trim().toLowerCase() : '' };

    const owner = await User.findOne(query);

    if (!owner?.nominee?.email) {
      return res.status(404).json({ success: false, message: 'Nominee record not found' });
    }

    if (!canReviewNominee(req.user)) {
      return res.status(403).json({ success: false, message: 'Only an admin reviewer can activate nominee access' });
    }

    if (owner.nominee.email === req.user.email) {
      return res.status(403).json({ success: false, message: 'Nominees cannot activate their own access' });
    }

    if (!owner.nominee.claim?.submittedAt || !verificationNotes?.trim()) {
      return res.status(400).json({ success: false, message: 'Claim proof and final verification notes are required' });
    }

    if (!owner.nominee.claim.proofDocumentUrl) {
      return res.status(400).json({ success: false, message: 'A submitted proof document is required before activation' });
    }

    if (LEGAL_CONDITIONS.includes(owner.nominee.condition) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Legal-condition activations require admin verification' });
    }

    if (owner.nominee.status === 'pending') {
      owner.nominee.approvedAt = new Date();
      owner.nominee.claim.reviewedBy = req.user._id;
      owner.nominee.claim.reviewedAt = new Date();
    } else if (owner.nominee.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Nominee claim must be pending or approved before activation' });
    }

    owner.nominee.status = 'active';
    owner.nominee.activatedAt = new Date();
    owner.nominee.claim.activatedBy = req.user._id;
    owner.nominee.claim.activationNotes = verificationNotes.trim();

    await owner.save();
    await logNomineeEvent(req.user._id, 'NOMINEE_ACTIVATED', {
      ownerId: owner._id,
      nomineeEmail: owner.nominee.email,
      condition: owner.nominee.condition
    });

    return res.status(200).json({
      success: true,
      message: 'Nominee access activated.',
      data: sanitizeNominee(owner.nominee)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const revokeNominee = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id);

    if (!owner?.nominee?.email) {
      return res.status(404).json({ success: false, message: 'Nominee record not found' });
    }

    owner.nominee.status = 'revoked';
    owner.nominee.activatedAt = null;

    await owner.save();
    await logNomineeEvent(owner._id, 'NOMINEE_REVOKED', { nomineeEmail: owner.nominee.email });

    return res.status(200).json({
      success: true,
      message: 'Nominee revoked.',
      data: sanitizeNominee(owner.nominee)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerNominee,
  getNomineeStatus,
  claimNomineeAccess,
  listNomineeClaims,
  approveNomineeClaim,
  activateNomineeAccess,
  revokeNominee
};
