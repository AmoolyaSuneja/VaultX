const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Vault = require('../models/vault');
const SharedLink = require('../models/sharedLink');
const { decrypt } = require('../Utils/encryption');
const { enforceVaultUnlock } = require('../Utils/lockAccess');
const { pipeRemoteDocument, resolveDocumentKind } = require('../Utils/remoteDocument');
const { buildAppUrl } = require('../Utils/appUrl');

function decryptFileList(filePaths = []) {
  return filePaths.map((filePath) => decrypt(filePath));
}

const createSharedLink = async (req, res) => {
  try {
    const { filePath, password } = req.body;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ success: false, message: 'Document reference is required' });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const vaultEntry = await Vault.findById(req.params.id);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (vaultEntry.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to share documents from this entry' });
    }

    if (await enforceVaultUnlock(req, res, vaultEntry, 'create a shared link')) {
      return;
    }

    const decryptedFiles = decryptFileList(vaultEntry.filePath || []);

    if (!decryptedFiles.includes(filePath)) {
      return res.status(400).json({ success: false, message: 'That document does not belong to this vault entry' });
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

    return res.status(201).json({
      success: true,
      message: 'Protected share link created',
      data: {
        shareId,
        link: buildAppUrl(req, `/shared/${shareId}`)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSharedLinkInfo = async (req, res) => {
  try {
    const sharedLink = await SharedLink.findOne({ shareId: req.params.shareId });

    if (!sharedLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const filePath = decrypt(sharedLink.filePath);

    return res.status(200).json({
      success: true,
      data: {
        kind: await resolveDocumentKind(filePath)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifySharedLinkPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const sharedLink = await SharedLink.findOne({ shareId: req.params.shareId }).select('+passwordHash');

    if (!sharedLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const matches = await bcrypt.compare(password.trim(), sharedLink.passwordHash);

    if (!matches) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const filePath = decrypt(sharedLink.filePath);
    const accessToken = jwt.sign(
      {
        shareId: sharedLink.shareId,
        scope: 'shared-document-download'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Password verified',
      data: {
        accessToken,
        kind: await resolveDocumentKind(filePath)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function validateDownloadToken(shareId, token) {
  if (!token || typeof token !== 'string') {
    return { error: 'Download token is required' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.scope !== 'shared-document-download' || decoded.shareId !== shareId) {
      return { error: 'Invalid download token scope' };
    }

    return { decoded };
  } catch {
    return { error: 'Invalid or expired download token' };
  }
}

const downloadSharedDocument = async (req, res) => {
  try {
    const { token } = req.query;
    const validation = validateDownloadToken(req.params.shareId, token);

    if (validation.error) {
      return res.status(401).json({ success: false, message: validation.error });
    }

    const sharedLink = await SharedLink.findOne({ shareId: req.params.shareId });

    if (!sharedLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const vaultEntry = await Vault.findById(sharedLink.vault);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (await enforceVaultUnlock(req, res, vaultEntry, 'download a shared document')) {
      return;
    }

    const filePath = decrypt(sharedLink.filePath);
    const proxied = await pipeRemoteDocument(req, res, filePath, {
      disposition: 'attachment'
    });

    if (!proxied.ok) {
      return res.status(502).json({ success: false, message: 'Unable to fetch shared document' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const previewSharedDocument = async (req, res) => {
  try {
    const { token } = req.query;
    const validation = validateDownloadToken(req.params.shareId, token);

    if (validation.error) {
      return res.status(401).json({ success: false, message: validation.error });
    }

    const sharedLink = await SharedLink.findOne({ shareId: req.params.shareId });

    if (!sharedLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const vaultEntry = await Vault.findById(sharedLink.vault);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (await enforceVaultUnlock(req, res, vaultEntry, 'preview a shared document')) {
      return;
    }

    const filePath = decrypt(sharedLink.filePath);
    const proxied = await pipeRemoteDocument(req, res, filePath, {
      disposition: 'inline'
    });

    if (!proxied.ok) {
      return res.status(502).json({ success: false, message: 'Unable to fetch shared document preview' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSharedLink,
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument,
  previewSharedDocument
};
