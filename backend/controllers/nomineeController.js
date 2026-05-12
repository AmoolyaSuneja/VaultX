const User = require('../models/user');
const ActivityLog = require('../models/activitylog');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');

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
    throw new HttpError('Nominee condition must be death, incapacity, inactivity, or courtOrder', 400);
  }
}

function requireAdminReviewer(reqUser) {
  if (reqUser.role !== 'admin') {
    throw new HttpError('Only an admin reviewer can perform this action', 403);
  }
}

async function logNomineeEvent(userId, action, metadata = {}) {
  await ActivityLog.create({ user: userId, action, metadata });
}

function resolveOwnerQuery({ ownerId, ownerEmail }) {
  if (ownerId) return { _id: ownerId };
  const email = typeof ownerEmail === 'string' ? ownerEmail.trim().toLowerCase() : '';
  return { email };
}

const registerNominee = asyncHandler(async (req, res) => {
  const { name, email, relationship, condition } = req.body;
  const nomineeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!name?.trim() || !nomineeEmail || !relationship?.trim() || !condition) {
    throw new HttpError('Name, email, relationship, and condition are required', 400);
  }

  ensureCondition(condition);

  if (nomineeEmail === req.user.email) {
    throw new HttpError('Nominee must be a different user', 400);
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

  res.status(201).json({
    success: true,
    message: 'Nominee registered. They will not receive access until a claim is verified and activated.',
    data: sanitizeNominee(owner.nominee)
  });
});

const getNomineeStatus = asyncHandler(async (req, res) => {
  const owner = await User.findById(req.user._id).select('nominee');
  const nominatedBy = await User.find({
    'nominee.email': req.user.email,
    'nominee.status': { $in: ['pending', 'approved', 'active'] }
  }).select('name email nominee');

  res.status(200).json({
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
});

const claimNomineeAccess = asyncHandler(async (req, res) => {
  const { ownerEmail, proofType, proofNotes } = req.body;
  const normalizedOwnerEmail = typeof ownerEmail === 'string' ? ownerEmail.trim().toLowerCase() : '';

  if (!normalizedOwnerEmail || !proofType?.trim() || !proofNotes?.trim()) {
    throw new HttpError('Owner email, proof type, and proof notes are required', 400);
  }

  const uploadedUrl = req.file?.secure_url || req.file?.path || req.file?.url || '';

  if (!uploadedUrl) {
    throw new HttpError('A proof document is required for nominee claims', 400);
  }

  const owner = await User.findOne({
    email: normalizedOwnerEmail,
    'nominee.email': req.user.email,
    'nominee.status': { $in: ['pending', 'approved'] }
  });

  if (!owner) {
    throw new HttpError('No pending nomination was found for this owner and nominee', 404);
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

  res.status(200).json({
    success: true,
    message: 'Claim submitted. Access still requires verification and activation.',
    data: sanitizeNominee(owner.nominee)
  });
});

const listNomineeClaims = asyncHandler(async (req, res) => {
  requireAdminReviewer(req.user);

  const owners = await User.find({
    'nominee.claim.submittedAt': { $ne: null },
    'nominee.status': { $in: ['pending', 'approved'] }
  })
    .select('name email nominee')
    .sort({ 'nominee.claim.submittedAt': -1 });

  res.status(200).json({
    success: true,
    data: owners.map((owner) => ({
      ownerId: owner._id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      nominee: sanitizeNominee(owner.nominee)
    }))
  });
});

const approveNomineeClaim = asyncHandler(async (req, res) => {
  requireAdminReviewer(req.user);

  const owner = await User.findOne(resolveOwnerQuery(req.body));

  if (!owner?.nominee?.email) {
    throw new HttpError('Nominee record not found', 404);
  }

  if (owner.nominee.email === req.user.email) {
    throw new HttpError('Nominees cannot approve their own claims', 403);
  }

  if (!owner.nominee.claim?.submittedAt) {
    throw new HttpError('A claim must be submitted before approval', 400);
  }

  if (!owner.nominee.claim.proofDocumentUrl) {
    throw new HttpError('A submitted proof document is required before approval', 400);
  }

  owner.nominee.status = 'approved';
  owner.nominee.approvedAt = new Date();
  owner.nominee.claim.reviewedBy = req.user._id;
  owner.nominee.claim.reviewedAt = new Date();

  await owner.save();
  await logNomineeEvent(req.user._id, 'NOMINEE_APPROVED', {
    ownerId: owner._id,
    nomineeEmail: owner.nominee.email
  });

  res.status(200).json({
    success: true,
    message: 'Nominee claim approved. Activate only after final condition verification.',
    data: sanitizeNominee(owner.nominee)
  });
});

const activateNomineeAccess = asyncHandler(async (req, res) => {
  requireAdminReviewer(req.user);

  const { verificationNotes } = req.body;
  const owner = await User.findOne(resolveOwnerQuery(req.body));

  if (!owner?.nominee?.email) {
    throw new HttpError('Nominee record not found', 404);
  }

  if (owner.nominee.email === req.user.email) {
    throw new HttpError('Nominees cannot activate their own access', 403);
  }

  if (!owner.nominee.claim?.submittedAt || !verificationNotes?.trim()) {
    throw new HttpError('Claim proof and final verification notes are required', 400);
  }

  if (!owner.nominee.claim.proofDocumentUrl) {
    throw new HttpError('A submitted proof document is required before activation', 400);
  }

  if (LEGAL_CONDITIONS.includes(owner.nominee.condition) && req.user.role !== 'admin') {
    throw new HttpError('Legal-condition activations require admin verification', 403);
  }

  if (owner.nominee.status === 'pending') {
    owner.nominee.approvedAt = new Date();
    owner.nominee.claim.reviewedBy = req.user._id;
    owner.nominee.claim.reviewedAt = new Date();
  } else if (owner.nominee.status !== 'approved') {
    throw new HttpError('Nominee claim must be pending or approved before activation', 400);
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

  res.status(200).json({
    success: true,
    message: 'Nominee access activated.',
    data: sanitizeNominee(owner.nominee)
  });
});

const revokeNominee = asyncHandler(async (req, res) => {
  const owner = await User.findById(req.user._id);

  if (!owner?.nominee?.email) {
    throw new HttpError('Nominee record not found', 404);
  }

  owner.nominee.status = 'revoked';
  owner.nominee.activatedAt = null;

  await owner.save();
  await logNomineeEvent(owner._id, 'NOMINEE_REVOKED', { nomineeEmail: owner.nominee.email });

  res.status(200).json({
    success: true,
    message: 'Nominee revoked.',
    data: sanitizeNominee(owner.nominee)
  });
});

module.exports = {
  registerNominee,
  getNomineeStatus,
  claimNomineeAccess,
  listNomineeClaims,
  approveNomineeClaim,
  activateNomineeAccess,
  revokeNominee
};
