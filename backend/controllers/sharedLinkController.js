const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Vault = require('../models/vault');
const SharedLink = require('../models/sharedLink');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const { decrypt } = require('../Utils/encryption');
const { enforceVaultUnlock } = require('../Utils/lockAccess');
const { pipeRemoteDocument, resolveDocumentKind } = require('../Utils/remoteDocument');
const { buildAppUrl } = require('../Utils/appUrl');

/**
 * Returns true if dual-approval is required AND the active approval window
 * has not been granted (or has expired). Used to block share/download actions
 * that should only be possible while both participants have consented.
 */
function isDualApprovalBlocked(vaultEntry) {
  if (!vaultEntry.requiresDualApproval) return false;
  const expiresAt = vaultEntry?.dualAccess?.expiresAt;
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}

const DOWNLOAD_TOKEN_SCOPE = 'shared-document-download';
const DOWNLOAD_TOKEN_TTL = '15m';

function decryptFileList(filePaths = []) {
  return filePaths.map((filePath) => decrypt(filePath));
}

function validateDownloadToken(shareId, token) {
  if (!token || typeof token !== 'string') {
    throw new HttpError('Download token is required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.scope !== DOWNLOAD_TOKEN_SCOPE || decoded.shareId !== shareId) {
      throw new HttpError('Invalid download token scope', 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Invalid or expired download token', 401);
  }
}

async function loadSharedLink(shareId, { withPassword = false } = {}) {
  const query = SharedLink.findOne({ shareId });
  const sharedLink = await (withPassword ? query.select('+passwordHash') : query);

  if (!sharedLink) {
    throw new HttpError('Share link not found', 404);
  }

  return sharedLink;
}

async function loadVaultForSharedLink(vaultId) {
  const vaultEntry = await Vault.findById(vaultId);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  return vaultEntry;
}

const createSharedLink = asyncHandler(async (req, res) => {
  const { filePath, password } = req.body;
  const vaultEntry = await Vault.findById(req.params.id);

  if (!vaultEntry) {
    throw new HttpError('Vault entry not found', 404);
  }

  if (vaultEntry.owner.toString() !== req.user._id.toString()) {
    throw new HttpError('Not authorized to share documents from this entry', 401);
  }

  if (isDualApprovalBlocked(vaultEntry)) {
    throw new HttpError(
      'Both participants must approve access before a share link can be created for this entry',
      403
    );
  }

  if (await enforceVaultUnlock(req, res, vaultEntry, 'create a shared link')) {
    return;
  }

  const decryptedFiles = decryptFileList(vaultEntry.filePath || []);

  if (!decryptedFiles.includes(filePath)) {
    throw new HttpError('That document does not belong to this vault entry', 400);
  }

  const shareId = crypto.randomBytes(24).toString('hex');
  const passwordHash = await bcrypt.hash(password.trim(), 10);

  await SharedLink.create({
    shareId,
    vault: vaultEntry._id,
    owner: req.user._id,
    filePath,
    passwordHash
  });

  res.status(201).json({
    success: true,
    message: 'Protected share link created',
    data: {
      shareId,
      link: buildAppUrl(req, `/shared/${shareId}`)
    }
  });
});

const getSharedLinkInfo = asyncHandler(async (req, res) => {
  const sharedLink = await loadSharedLink(req.params.shareId);
  const filePath = decrypt(sharedLink.filePath);

  res.status(200).json({
    success: true,
    data: {
      kind: await resolveDocumentKind(filePath)
    }
  });
});

const verifySharedLinkPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const sharedLink = await loadSharedLink(req.params.shareId, { withPassword: true });
  const matches = await bcrypt.compare(password.trim(), sharedLink.passwordHash);

  if (!matches) {
    throw new HttpError('Incorrect password', 401);
  }

  const filePath = decrypt(sharedLink.filePath);
  const accessToken = jwt.sign(
    { shareId: sharedLink.shareId, scope: DOWNLOAD_TOKEN_SCOPE },
    process.env.JWT_SECRET,
    { expiresIn: DOWNLOAD_TOKEN_TTL }
  );

  res.status(200).json({
    success: true,
    message: 'Password verified',
    data: {
      accessToken,
      kind: await resolveDocumentKind(filePath)
    }
  });
});

async function serveSharedDocument(req, res, disposition) {
  validateDownloadToken(req.params.shareId, req.query.token);

  const sharedLink = await loadSharedLink(req.params.shareId);
  const vaultEntry = await loadVaultForSharedLink(sharedLink.vault);

  if (isDualApprovalBlocked(vaultEntry)) {
    throw new HttpError(
      'Active dual-approval is required to access this shared document',
      403
    );
  }

  if (await enforceVaultUnlock(req, res, vaultEntry, `preview or download a shared document`)) {
    return;
  }

  const filePath = decrypt(sharedLink.filePath);
  const proxied = await pipeRemoteDocument(req, res, filePath, { disposition });

  if (!proxied.ok) {
    throw new HttpError('Unable to fetch shared document', 502);
  }
}

const downloadSharedDocument = asyncHandler((req, res) => serveSharedDocument(req, res, 'attachment'));
const previewSharedDocument = asyncHandler((req, res) => serveSharedDocument(req, res, 'inline'));

module.exports = {
  createSharedLink,
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument,
  previewSharedDocument
};
