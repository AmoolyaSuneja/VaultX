const Vault = require('../models/vault');
const ActivityLog = require('../models/activitylog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const { decrypt, encrypt } = require('../Utils/encryption');
const { enforceVaultUnlock } = require('../Utils/lockAccess');
const { pipeRemoteDocument } = require('../Utils/remoteDocument');
const { normalizeUnlockAt, isVaultLocked } = require('../Utils/timeLock');
const { buildAppUrl } = require('../Utils/appUrl');
const { sendDualApprovalRequestEmail } = require('../Utils/email');
const { findVaultById, findVaultByIdWithRequester } = require('../Utils/vaultQuery');

const DUAL_ACCESS_WINDOW_MS = 10 * 60 * 1000;

function toIdString(value) {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
}

function isOwner(vaultEntry, userId) {
  return toIdString(vaultEntry.owner) === toIdString(userId);
}

function isSecondApprover(vaultEntry, userId) {
  return toIdString(vaultEntry.secondApprover) === toIdString(userId);
}

function isActiveNomineeOwner(vaultEntry, activeNomineeOwnerIds = new Set()) {
  return activeNomineeOwnerIds.has(toIdString(vaultEntry.owner));
}

function isDualAccessParticipant(vaultEntry, userId) {
  return isOwner(vaultEntry, userId) || isSecondApprover(vaultEntry, userId);
}

async function getActiveNomineeOwnerIds(user) {
  const owners = await User.find({
    'nominee.status': 'active',
    $or: [{ 'nominee.user': user._id }, { 'nominee.email': user.email }]
  }).select('_id');

  return owners.map((owner) => owner._id);
}

async function canReadVaultEntry(vaultEntry, user) {
  if (isDualAccessParticipant(vaultEntry, user._id)) {
    return {
      allowed: true,
      activeNomineeOwnerIds: new Set()
    };
  }

  const nomineeOwner = await User.findOne({
    _id: toIdString(vaultEntry.owner),
    'nominee.status': 'active',
    $or: [{ 'nominee.user': user._id }, { 'nominee.email': user.email }]
  }).select('_id');

  return {
    allowed: Boolean(nomineeOwner),
    activeNomineeOwnerIds: nomineeOwner ? new Set([nomineeOwner._id.toString()]) : new Set()
  };
}

function getUserSummary(user) {
  if (!user) return null;
  return { _id: user._id, name: user.name, email: user.email };
}

function getApprovalRequesterId(vaultEntry) {
  return toIdString(vaultEntry?.dualAccess?.requestedBy);
}

function isApprovalRequester(vaultEntry, userId) {
  const requesterId = getApprovalRequesterId(vaultEntry);
  return Boolean(requesterId) && requesterId === toIdString(userId);
}

function getCounterparty(vaultEntry, userId) {
  if (isOwner(vaultEntry, userId)) return vaultEntry.secondApprover;
  if (isSecondApprover(vaultEntry, userId)) return vaultEntry.owner;
  return null;
}

function hasActiveDualApproval(vaultEntry) {
  return Boolean(vaultEntry?.dualAccess?.expiresAt) && new Date(vaultEntry.dualAccess.expiresAt).getTime() > Date.now();
}

function getApprovalStatus(vaultEntry) {
  if (!vaultEntry.requiresDualApproval) return 'not_required';
  if (hasActiveDualApproval(vaultEntry)) return 'approved';
  if (vaultEntry?.dualAccess?.approvedAt) return 'expired';
  if (vaultEntry?.dualAccess?.requestedAt) return 'pending';
  return 'awaiting_request';
}

function buildAccessPolicy(vaultEntry, userId, activeNomineeOwnerIds = new Set()) {
  const role = isOwner(vaultEntry, userId)
    ? 'owner'
    : isSecondApprover(vaultEntry, userId)
      ? 'approver'
      : isActiveNomineeOwner(vaultEntry, activeNomineeOwnerIds)
        ? 'nominee'
        : 'viewer';
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
    secondApprover:
      vaultEntry.secondApprover && vaultEntry.secondApprover.email
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

function canViewSensitiveContent(vaultEntry, userId, activeNomineeOwnerIds = new Set()) {
  if (isActiveNomineeOwner(vaultEntry, activeNomineeOwnerIds)) return true;
  if (!isDualAccessParticipant(vaultEntry, userId)) return false;
  if (!vaultEntry.requiresDualApproval) return true;
  return hasActiveDualApproval(vaultEntry);
}

async function resolveSecondApprover(ownerId, requiresDualApproval, secondApproverEmail) {
  if (!requiresDualApproval) return null;

  if (!secondApproverEmail) {
    throw new HttpError('Second approver email is required', 400);
  }

  const approver = await User.findOne({ email: secondApproverEmail.trim().toLowerCase() });

  if (!approver) {
    throw new HttpError('Second approver account was not found', 400);
  }

  if (approver._id.toString() === ownerId.toString()) {
    throw new HttpError('Second approver must be a different user', 400);
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
  const { redactLocked = false, redactSensitive = false, userId = null, activeNomineeOwnerIds = new Set() } = options;
  const formattedEntry = vaultEntry.toObject();
  const fileCount = Array.isArray(formattedEntry.filePath) ? formattedEntry.filePath.length : 0;
  const locked = isVaultLocked(formattedEntry);

  formattedEntry.title = decrypt(formattedEntry.title);
  formattedEntry.data = decrypt(formattedEntry.data);
  formattedEntry.password = decrypt(formattedEntry.password);
  formattedEntry.notes = decrypt(formattedEntry.notes);
  formattedEntry.attachmentCount = fileCount;
  formattedEntry.accessPolicy = userId ? buildAccessPolicy(vaultEntry, userId, activeNomineeOwnerIds) : undefined;

  if (redactLocked && locked) return redactFormattedEntry(formattedEntry, fileCount);
  if (redactSensitive) return redactFormattedEntry(formattedEntry, fileCount);

  formattedEntry.filePath = (formattedEntry.filePath || []).map((filePath) => decrypt(filePath));
  return formattedEntry;
};

const createVaultEntry = asyncHandler(async (req, res) => {
  const { title, data, category, tags, url, username, password, notes, unlockAt, secondApproverEmail } = req.body;
  const requiresDualApproval = req.body.requiresDualApproval === true || req.body.requiresDualApproval === 'true';
  const secondApprover = await resolveSecondApprover(req.user._id, requiresDualApproval, secondApproverEmail);

  const uploadedFiles = Array.isArray(req.files)
    ? req.files.map((file) => file.secure_url || file.path).filter(Boolean)
    : [];

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

  const populatedEntry = await findVaultById(vaultEntry._id);

  res.status(201).json({
    success: true,
    message: 'Vault entry created successfully',
    data: formatVaultEntry(populatedEntry, { userId: req.user._id })
  });
});

const getVaultEntryById = asyncHandler(async (req, res) => {
  const vaultEntry = await findVaultById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  const readAccess = await canReadVaultEntry(vaultEntry, req.user);

  if (!readAccess.allowed) {
    throw new HttpError('Not authorized to view this entry', 401);
  }

  if (await enforceVaultUnlock(req, res, vaultEntry, 'view vault entry details')) {
    return;
  }

  res.status(200).json({
    success: true,
    data: formatVaultEntry(vaultEntry, {
      redactSensitive: !canViewSensitiveContent(vaultEntry, req.user._id, readAccess.activeNomineeOwnerIds),
      userId: req.user._id,
      activeNomineeOwnerIds: readAccess.activeNomineeOwnerIds
    })
  });
});

const getAllVaultEntries = asyncHandler(async (req, res) => {
  const nomineeOwnerIds = await getActiveNomineeOwnerIds(req.user);
  const activeNomineeOwnerIds = new Set(nomineeOwnerIds.map((ownerId) => ownerId.toString()));

  const vaults = await Vault.find({
    $or: [{ owner: req.user._id }, { secondApprover: req.user._id }, { owner: { $in: nomineeOwnerIds } }]
  })
    .populate('owner', 'name email')
    .populate('secondApprover', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: vaults.map((vaultEntry) =>
      formatVaultEntry(vaultEntry, {
        redactLocked: true,
        redactSensitive: true,
        userId: req.user._id,
        activeNomineeOwnerIds
      })
    )
  });
});

const updateVaultEntry = asyncHandler(async (req, res) => {
  const vaultEntry = await Vault.findById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  if (!isOwner(vaultEntry, req.user._id)) {
    throw new HttpError('Not authorized to update this entry', 401);
  }

  const requiresDualApprovalChanged = req.body.requiresDualApproval !== undefined;
  const secondApproverEmailChanged = req.body.secondApproverEmail !== undefined;
  const requiresDualApproval = requiresDualApprovalChanged
    ? req.body.requiresDualApproval === true || req.body.requiresDualApproval === 'true'
    : vaultEntry.requiresDualApproval;
  const secondApprover =
    requiresDualApprovalChanged || secondApproverEmailChanged
      ? await resolveSecondApprover(req.user._id, requiresDualApproval, req.body.secondApproverEmail)
      : null;

  let uploadedFiles = vaultEntry.filePath || [];
  if (Array.isArray(req.files) && req.files.length > 0) {
    uploadedFiles = [...uploadedFiles, ...req.files.map((file) => file.secure_url || file.path).filter(Boolean)];
  }

  const allowedUpdates = ['title', 'data', 'category', 'tags', 'filePath', 'url', 'username', 'password', 'notes'];

  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      vaultEntry[field] = req.body[field];
    }
  }

  if (req.body.unlockAt !== undefined) {
    vaultEntry.unlockAt = normalizeUnlockAt(req.body.unlockAt);
  }

  if (requiresDualApprovalChanged) {
    vaultEntry.requiresDualApproval = requiresDualApproval;
  }

  if (requiresDualApprovalChanged || secondApproverEmailChanged) {
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

  const populatedEntry = await findVaultById(vaultEntry._id);

  res.status(200).json({
    success: true,
    message: 'Vault entry updated',
    data: formatVaultEntry(populatedEntry, { userId: req.user._id })
  });
});

const deleteVaultEntry = asyncHandler(async (req, res) => {
  const vaultEntry = await Vault.findById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  if (!isOwner(vaultEntry, req.user._id)) {
    throw new HttpError('Not authorized to delete this entry', 401);
  }

  await vaultEntry.deleteOne();

  await ActivityLog.create({
    user: req.user._id,
    action: 'VAULT_DELETED',
    vault: vaultEntry._id,
    metadata: { title: vaultEntry.title }
  });

  res.status(200).json({ success: true, message: 'Vault entry deleted successfully' });
});

const requestVaultAccessApproval = asyncHandler(async (req, res) => {
  const vaultEntry = await findVaultById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  if (!isDualAccessParticipant(vaultEntry, req.user._id)) {
    throw new HttpError('Only vault participants can request dual approval', 401);
  }

  if (!vaultEntry.requiresDualApproval || !vaultEntry.secondApprover) {
    throw new HttpError('Dual approval is not enabled for this entry', 400);
  }

  const approvalTarget = getCounterparty(vaultEntry, req.user._id);

  if (!approvalTarget?.email) {
    throw new HttpError('The other vault participant could not be found', 400);
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
    emailErrorMessage = 'Email delivery failed';
  }

  res.status(200).json({
    success: true,
    message: emailSent
      ? `Approval email sent to ${approvalTarget.email}`
      : `Approval request created for ${approvalTarget.email}${emailErrorMessage ? ` (${emailErrorMessage})` : ''}`,
    data: formatVaultEntry(vaultEntry, { redactSensitive: true, userId: req.user._id })
  });
});

const approveVaultAccessFromEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError('Approval link is invalid or expired', 401);
  }

  if (decoded.scope !== 'dual-access-email-approval') {
    throw new HttpError('Approval link has invalid scope', 401);
  }

  const vaultEntry = await findVaultByIdWithRequester(decoded.vaultId);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  if (!vaultEntry.requiresDualApproval) {
    throw new HttpError('Dual approval is not enabled for this entry', 400);
  }

  if (!vaultEntry?.dualAccess?.requestedAt) {
    throw new HttpError('There is no pending approval request for this entry', 400);
  }

  if (getApprovalRequesterId(vaultEntry) !== toIdString(decoded.requesterId)) {
    throw new HttpError('This approval link no longer matches the active request', 400);
  }

  if (new Date(vaultEntry.dualAccess.requestedAt).toISOString() !== decoded.requestedAt) {
    throw new HttpError('This approval link has already been replaced by a newer request', 400);
  }

  if (!isDualAccessParticipant(vaultEntry, decoded.approverId)) {
    throw new HttpError('Approval link is not valid for this vault entry', 401);
  }

  if (isApprovalRequester(vaultEntry, decoded.approverId)) {
    throw new HttpError('The requester cannot approve their own request', 400);
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

  res.status(200).json({
    success: true,
    message: 'Access approved for 10 minutes',
    data: {
      vaultId: vaultEntry._id,
      expiresAt: vaultEntry.dualAccess.expiresAt
    }
  });
});

async function resolveOwnedAttachment(req, res) {
  const vaultEntry = await findVaultById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  const readAccess = await canReadVaultEntry(vaultEntry, req.user);

  if (!readAccess.allowed) {
    throw new HttpError('Not authorized to access this attachment', 401);
  }

  if (!canViewSensitiveContent(vaultEntry, req.user._id, readAccess.activeNomineeOwnerIds)) {
    throw new HttpError('The other vault participant must approve access before attachments can be opened', 403);
  }

  if (await enforceVaultUnlock(req, res, vaultEntry, 'access vault attachment')) {
    return null;
  }

  const attachmentIndex = Number(req.params.attachmentIndex);

  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    throw new HttpError('Invalid attachment index', 400);
  }

  const decryptedFiles = (vaultEntry.filePath || []).map((filePath) => decrypt(filePath));
  const filePath = decryptedFiles[attachmentIndex];

  if (!filePath) {
    throw new HttpError('Attachment not found', 404);
  }

  return { filePath };
}

const previewVaultAttachment = asyncHandler(async (req, res) => {
  const attachment = await resolveOwnedAttachment(req, res);

  if (!attachment) return;

  const proxied = await pipeRemoteDocument(req, res, attachment.filePath, { disposition: 'inline' });

  if (!proxied.ok) {
    throw new HttpError('Unable to fetch attachment preview', 502);
  }
});

const downloadVaultAttachment = asyncHandler(async (req, res) => {
  const attachment = await resolveOwnedAttachment(req, res);

  if (!attachment) return;

  const proxied = await pipeRemoteDocument(req, res, attachment.filePath, { disposition: 'attachment' });

  if (!proxied.ok) {
    throw new HttpError('Unable to fetch attachment', 502);
  }
});

module.exports = {
  createVaultEntry,
  getVaultEntryById,
  getAllVaultEntries,
  updateVaultEntry,
  deleteVaultEntry,
  requestVaultAccessApproval,
  approveVaultAccessFromEmail,
  previewVaultAttachment,
  downloadVaultAttachment
};
