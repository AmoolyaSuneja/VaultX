const Vault = require('../models/vault');
const ActivityLog = require('../models/activitylog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { decrypt, encrypt } = require('../Utils/encryption');
const { enforceVaultUnlock } = require('../Utils/lockAccess');
const { pipeRemoteDocument } = require('../Utils/remoteDocument');
const { normalizeUnlockAt, isVaultLocked } = require('../Utils/timeLock');
const { buildAppUrl } = require('../Utils/appUrl');
const { sendDualApprovalRequestEmail } = require('../Utils/email');

const DUAL_ACCESS_WINDOW_MS = 10 * 60 * 1000;

function toIdString(value) {
  if (!value) {
    return '';
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function isOwner(vaultEntry, userId) {
  return toIdString(vaultEntry.owner) === toIdString(userId);
}

function isSecondApprover(vaultEntry, userId) {
  return toIdString(vaultEntry.secondApprover) === toIdString(userId);
}

function isDualAccessParticipant(vaultEntry, userId) {
  return isOwner(vaultEntry, userId) || isSecondApprover(vaultEntry, userId);
}

function getUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email
  };
}

function getApprovalRequesterId(vaultEntry) {
  return toIdString(vaultEntry?.dualAccess?.requestedBy);
}

function isApprovalRequester(vaultEntry, userId) {
  const requesterId = getApprovalRequesterId(vaultEntry);
  return Boolean(requesterId) && requesterId === toIdString(userId);
}

function getCounterparty(vaultEntry, userId) {
  if (isOwner(vaultEntry, userId)) {
    return vaultEntry.secondApprover;
  }

  if (isSecondApprover(vaultEntry, userId)) {
    return vaultEntry.owner;
  }

  return null;
}

function hasActiveDualApproval(vaultEntry) {
  return Boolean(vaultEntry?.dualAccess?.expiresAt) && new Date(vaultEntry.dualAccess.expiresAt).getTime() > Date.now();
}

function getApprovalStatus(vaultEntry) {
  if (!vaultEntry.requiresDualApproval) {
    return 'not_required';
  }

  if (hasActiveDualApproval(vaultEntry)) {
    return 'approved';
  }

  if (vaultEntry?.dualAccess?.approvedAt) {
    return 'expired';
  }

  if (vaultEntry?.dualAccess?.requestedAt) {
    return 'pending';
  }

  return 'awaiting_request';
}

function buildAccessPolicy(vaultEntry, userId) {
  const role = isOwner(vaultEntry, userId) ? 'owner' : isSecondApprover(vaultEntry, userId) ? 'approver' : 'viewer';
  const requestedByCurrentUser = isApprovalRequester(vaultEntry, userId);
  const requester = getUserSummary(vaultEntry?.dualAccess?.requestedBy);
  const approvalTarget = getUserSummary(getCounterparty(vaultEntry, userId));
  const canRequestApproval =
    (role === 'owner' || role === 'approver') &&
    Boolean(vaultEntry.requiresDualApproval) &&
    getApprovalStatus(vaultEntry) !== 'approved';

  return {
    role,
    requiresDualApproval: Boolean(vaultEntry.requiresDualApproval),
    secondApprover: vaultEntry.secondApprover && vaultEntry.secondApprover.email
      ? {
          _id: vaultEntry.secondApprover._id,
          name: vaultEntry.secondApprover.name,
          email: vaultEntry.secondApprover.email
        }
      : null,
    owner: vaultEntry.owner && vaultEntry.owner.email ? getUserSummary(vaultEntry.owner) : null,
    approvalTarget,
    requestedBy: requester,
    requestedByCurrentUser,
    approvalStatus: getApprovalStatus(vaultEntry),
    requestedAt: vaultEntry?.dualAccess?.requestedAt || null,
    approvedAt: vaultEntry?.dualAccess?.approvedAt || null,
    approvalExpiresAt: vaultEntry?.dualAccess?.expiresAt || null,
    canRequestApproval,
    canApprove: false
  };
}

function canViewSensitiveContent(vaultEntry, userId) {
  if (!isDualAccessParticipant(vaultEntry, userId)) {
    return false;
  }

  if (!vaultEntry.requiresDualApproval) {
    return true;
  }

  return hasActiveDualApproval(vaultEntry);
}

async function resolveSecondApprover(ownerId, requiresDualApproval, secondApproverEmail) {
  if (!requiresDualApproval) {
    return null;
  }

  if (!secondApproverEmail) {
    const error = new Error('Second approver email is required');
    error.statusCode = 400;
    throw error;
  }

  const approver = await User.findOne({ email: secondApproverEmail.trim().toLowerCase() });

  if (!approver) {
    const error = new Error('Second approver account was not found');
    error.statusCode = 400;
    throw error;
  }

  if (approver._id.toString() === ownerId.toString()) {
    const error = new Error('Second approver must be a different user');
    error.statusCode = 400;
    throw error;
  }

  return approver;
}

function redactFormattedEntry(formattedEntry, fileCount) {
  formattedEntry.url = '';
  formattedEntry.username = '';
  formattedEntry.password = '';
  formattedEntry.notes = '';
  formattedEntry.data = '';
  formattedEntry.filePath = [];
  formattedEntry.attachmentCount = fileCount;
  return formattedEntry;
}

const formatVaultEntry = (vaultEntry, options = {}) => {
  const { redactLocked = false, redactSensitive = false, userId = null } = options;
  const formattedEntry = vaultEntry.toObject();
  const fileCount = Array.isArray(formattedEntry.filePath) ? formattedEntry.filePath.length : 0;
  const locked = isVaultLocked(formattedEntry);

  formattedEntry.title = decrypt(formattedEntry.title);
  formattedEntry.data = decrypt(formattedEntry.data);
  formattedEntry.password = decrypt(formattedEntry.password);
  formattedEntry.notes = decrypt(formattedEntry.notes);
  formattedEntry.attachmentCount = fileCount;
  formattedEntry.accessPolicy = userId ? buildAccessPolicy(vaultEntry, userId) : undefined;

  if (redactLocked && locked) {
    return redactFormattedEntry(formattedEntry, fileCount);
  }

  if (redactSensitive) {
    return redactFormattedEntry(formattedEntry, fileCount);
  }

  formattedEntry.filePath = (formattedEntry.filePath || []).map((filePath) => decrypt(filePath));
  return formattedEntry;
};

const createVaultEntry = async (req, res) => {
  try {
    const { title, data, category, tags, url, username, password, notes, unlockAt, secondApproverEmail } = req.body;
    const requiresDualApproval = req.body.requiresDualApproval === true || req.body.requiresDualApproval === 'true';
    const secondApprover = await resolveSecondApprover(req.user._id, requiresDualApproval, secondApproverEmail);

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map((file) => file.secure_url || file.path);
    }

    const vaultEntry = new Vault({
      title,
      data: data || notes || '',
      category,
      tags,
      url,
      username,
      password,
      notes,
      unlockAt: normalizeUnlockAt(unlockAt) ?? null,
      requiresDualApproval,
      secondApprover: secondApprover?._id || null,
      owner: req.user._id,
      filePath: uploadedFiles
    });

    await vaultEntry.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'VAULT_CREATED',
      vault: vaultEntry._id,
      metadata: { title: encrypt(title) }
    });

    const populatedEntry = await Vault.findById(vaultEntry._id)
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email');

    res.status(201).json({
      success: true,
      message: 'Vault entry created successfully',
      data: formatVaultEntry(populatedEntry, { userId: req.user._id })
    });
  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getVaultEntryById = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email');

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (!isOwner(vaultEntry, req.user._id) && !isSecondApprover(vaultEntry, req.user._id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this entry' });
    }

    if (await enforceVaultUnlock(req, res, vaultEntry, 'view vault entry details')) {
      return;
    }

    return res.status(200).json({
      success: true,
      data: formatVaultEntry(vaultEntry, {
        redactSensitive: !canViewSensitiveContent(vaultEntry, req.user._id),
        userId: req.user._id
      })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllVaultEntries = async (req, res) => {
  try {
    const vaults = await Vault.find({
      $or: [{ owner: req.user._id }, { secondApprover: req.user._id }]
    })
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults.map((vaultEntry) =>
        formatVaultEntry(vaultEntry, {
          redactLocked: true,
          redactSensitive: true,
          userId: req.user._id
        })
      )
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updateVaultEntry = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (!isOwner(vaultEntry, req.user._id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this entry' });
    }

    const requiresDualApproval =
      req.body.requiresDualApproval !== undefined
        ? req.body.requiresDualApproval === true || req.body.requiresDualApproval === 'true'
        : vaultEntry.requiresDualApproval;
    const secondApprover =
      req.body.requiresDualApproval !== undefined || req.body.secondApproverEmail !== undefined
        ? await resolveSecondApprover(req.user._id, requiresDualApproval, req.body.secondApproverEmail)
        : null;

    let uploadedFiles = vaultEntry.filePath || [];
    if (req.files && req.files.length > 0) {
      uploadedFiles = [...uploadedFiles, ...req.files.map((file) => file.secure_url || file.path)];
    }

    const allowedUpdates = ['title', 'data', 'category', 'tags', 'filePath', 'url', 'username', 'password', 'notes'];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        vaultEntry[field] = req.body[field];
      }
    });

    if (req.body.unlockAt !== undefined) {
      vaultEntry.unlockAt = normalizeUnlockAt(req.body.unlockAt);
    }

    if (req.body.requiresDualApproval !== undefined) {
      vaultEntry.requiresDualApproval = requiresDualApproval;
    }

    if (req.body.requiresDualApproval !== undefined || req.body.secondApproverEmail !== undefined) {
      vaultEntry.secondApprover = requiresDualApproval ? secondApprover?._id || null : null;
      vaultEntry.dualAccess = {
        requestedBy: null,
        requestedAt: null,
        approvedBy: null,
        approvedAt: null,
        expiresAt: null
      };
    }

    vaultEntry.data = req.body.data || req.body.notes || vaultEntry.data || '';
    vaultEntry.filePath = uploadedFiles;

    await vaultEntry.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'VAULT_UPDATED',
      vault: vaultEntry._id,
      metadata: { title: vaultEntry.title }
    });

    const populatedEntry = await Vault.findById(vaultEntry._id)
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email');

    res.status(200).json({
      success: true,
      data: formatVaultEntry(populatedEntry, { userId: req.user._id })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteVaultEntry = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (!isOwner(vaultEntry, req.user._id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this entry' });
    }

    await vaultEntry.deleteOne();

    await ActivityLog.create({
      user: req.user._id,
      action: 'VAULT_DELETED',
      vault: vaultEntry._id,
      metadata: { title: vaultEntry.title }
    });

    res.status(200).json({ success: true, message: 'Vault entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestVaultAccessApproval = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email');

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (!isDualAccessParticipant(vaultEntry, req.user._id)) {
      return res.status(401).json({ success: false, message: 'Only vault participants can request dual approval' });
    }

    if (!vaultEntry.requiresDualApproval || !vaultEntry.secondApprover) {
      return res.status(400).json({ success: false, message: 'Dual approval is not enabled for this entry' });
    }

    const approvalTarget = getCounterparty(vaultEntry, req.user._id);

    if (!approvalTarget?.email) {
      return res.status(400).json({ success: false, message: 'The other vault participant could not be found' });
    }

    vaultEntry.dualAccess = {
      requestedBy: req.user._id,
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      expiresAt: null
    };

    await vaultEntry.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'VAULT_ACCESS_REQUESTED',
      vault: vaultEntry._id,
      metadata: { approvalTargetEmail: approvalTarget.email }
    });

    const entryTitle = decrypt(vaultEntry.title);
    const approvalToken = jwt.sign(
      {
        scope: 'dual-access-email-approval',
        vaultId: vaultEntry._id.toString(),
        requesterId: req.user._id.toString(),
        approverId: approvalTarget._id.toString(),
        requestedAt: vaultEntry.dualAccess.requestedAt.toISOString()
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    const approvalUrl = buildAppUrl(req, `/approve-access/${approvalToken}`);
    let emailSent = false;
    let emailErrorMessage = '';

    try {
      const emailResult = await sendDualApprovalRequestEmail({
        to: approvalTarget.email,
        approverName: approvalTarget.name,
        ownerName: req.user.name,
        entryTitle,
        approvalUrl
      });
      emailSent = Boolean(emailResult.sent);
      if (emailResult.skipped) {
        emailErrorMessage = 'SMTP credentials are not configured on the server';
      }
    } catch (emailError) {
      console.error('Approval email failed:', emailError.message);
      emailErrorMessage = emailError.message;
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? `Approval email sent to ${approvalTarget.email}`
        : `Approval request created for ${approvalTarget.email}, but email was not sent${emailErrorMessage ? `: ${emailErrorMessage}` : ''}`,
      data: formatVaultEntry(vaultEntry, { redactSensitive: true, userId: req.user._id })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveVaultAccessRequest = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Access approval must be granted from the email approval link'
  });
};

const approveVaultAccessFromEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Approval token is required' });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Approval link is invalid or expired' });
    }

    if (decoded.scope !== 'dual-access-email-approval') {
      return res.status(401).json({ success: false, message: 'Approval link has invalid scope' });
    }

    const vaultEntry = await Vault.findById(decoded.vaultId)
      .populate('owner', 'name email')
      .populate('secondApprover', 'name email')
      .populate('dualAccess.requestedBy', 'name email');

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (!vaultEntry.requiresDualApproval) {
      return res.status(400).json({ success: false, message: 'Dual approval is not enabled for this entry' });
    }

    if (!vaultEntry?.dualAccess?.requestedAt) {
      return res.status(400).json({ success: false, message: 'There is no pending approval request for this entry' });
    }

    if (getApprovalRequesterId(vaultEntry) !== toIdString(decoded.requesterId)) {
      return res.status(400).json({ success: false, message: 'This approval link no longer matches the active request' });
    }

    if (new Date(vaultEntry.dualAccess.requestedAt).toISOString() !== decoded.requestedAt) {
      return res.status(400).json({ success: false, message: 'This approval link has already been replaced by a newer request' });
    }

    if (!isDualAccessParticipant(vaultEntry, decoded.approverId)) {
      return res.status(401).json({ success: false, message: 'Approval link is not valid for this vault entry' });
    }

    if (isApprovalRequester(vaultEntry, decoded.approverId)) {
      return res.status(400).json({ success: false, message: 'The requester cannot approve their own request' });
    }

    const approvedAt = new Date();
    vaultEntry.dualAccess = {
      ...vaultEntry.dualAccess,
      approvedBy: decoded.approverId,
      approvedAt,
      expiresAt: new Date(approvedAt.getTime() + DUAL_ACCESS_WINDOW_MS)
    };

    await vaultEntry.save();

    await ActivityLog.create({
      user: decoded.approverId,
      action: 'VAULT_ACCESS_APPROVED',
      vault: vaultEntry._id,
      metadata: { expiresAt: vaultEntry.dualAccess.expiresAt, approvedFrom: 'email' }
    });

    return res.status(200).json({
      success: true,
      message: 'Access approved for 10 minutes',
      data: {
        vaultId: vaultEntry._id,
        expiresAt: vaultEntry.dualAccess.expiresAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function resolveOwnedAttachment(req, res) {
  const vaultEntry = await Vault.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('secondApprover', 'name email');

  if (!vaultEntry) {
    res.status(404).json({ success: false, message: 'Vault entry not found' });
    return null;
  }

  if (!isDualAccessParticipant(vaultEntry, req.user._id)) {
    res.status(401).json({ success: false, message: 'Not authorized to access this attachment' });
    return null;
  }

  if (!canViewSensitiveContent(vaultEntry, req.user._id)) {
    res.status(403).json({ success: false, message: 'The other vault participant must approve access before attachments can be opened' });
    return null;
  }

  if (await enforceVaultUnlock(req, res, vaultEntry, 'access vault attachment')) {
    return null;
  }

  const attachmentIndex = Number(req.params.attachmentIndex);

  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    res.status(400).json({ success: false, message: 'Invalid attachment index' });
    return null;
  }

  const decryptedFiles = (vaultEntry.filePath || []).map((filePath) => decrypt(filePath));
  const filePath = decryptedFiles[attachmentIndex];

  if (!filePath) {
    res.status(404).json({ success: false, message: 'Attachment not found' });
    return null;
  }

  return {
    filePath
  };
}

const previewVaultAttachment = async (req, res) => {
  try {
    const attachment = await resolveOwnedAttachment(req, res);

    if (!attachment) {
      return;
    }

    const proxied = await pipeRemoteDocument(req, res, attachment.filePath, {
      disposition: 'inline'
    });

    if (!proxied.ok) {
      return res.status(502).json({ success: false, message: 'Unable to fetch attachment preview' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadVaultAttachment = async (req, res) => {
  try {
    const attachment = await resolveOwnedAttachment(req, res);

    if (!attachment) {
      return;
    }

    const proxied = await pipeRemoteDocument(req, res, attachment.filePath, {
      disposition: 'attachment'
    });

    if (!proxied.ok) {
      return res.status(502).json({ success: false, message: 'Unable to fetch attachment' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createVaultEntry,
  getVaultEntryById,
  getAllVaultEntries,
  updateVaultEntry,
  deleteVaultEntry,
  requestVaultAccessApproval,
  approveVaultAccessRequest,
  approveVaultAccessFromEmail,
  previewVaultAttachment,
  downloadVaultAttachment
};
