const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Readable } = require('stream');
const Vault = require('../models/vault');
const SharedLink = require('../models/sharedLink');
const { decrypt } = require('../Utils/encryption');

function decryptFileList(filePaths = []) {
  return filePaths.map((filePath) => decrypt(filePath));
}

function getDocumentKind(filePath) {
  if (/\.pdf(?:$|\?)/i.test(filePath)) return 'pdf';
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(?:$|\?)/i.test(filePath)) return 'image';
  return 'file';
}

function getDownloadFilename(contentType, fallbackKind) {
  const normalized = (contentType || '').toLowerCase();

  if (normalized.includes('application/pdf') || fallbackKind === 'pdf') return 'shared-document.pdf';
  if (normalized.includes('image/jpeg')) return 'shared-document.jpg';
  if (normalized.includes('image/png')) return 'shared-document.png';
  if (normalized.includes('image/webp')) return 'shared-document.webp';
  if (normalized.includes('image/gif')) return 'shared-document.gif';
  if (normalized.includes('image/bmp')) return 'shared-document.bmp';
  if (normalized.includes('image/svg+xml')) return 'shared-document.svg';

  return 'shared-document.bin';
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
        link: `${req.protocol}://${req.get('host')}/shared/${shareId}`
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
        kind: getDocumentKind(filePath)
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
        kind: getDocumentKind(filePath)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const downloadSharedDocument = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ success: false, message: 'Download token is required' });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired download token' });
    }

    if (decoded.scope !== 'shared-document-download' || decoded.shareId !== req.params.shareId) {
      return res.status(401).json({ success: false, message: 'Invalid download token scope' });
    }

    const sharedLink = await SharedLink.findOne({ shareId: req.params.shareId });

    if (!sharedLink) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const filePath = decrypt(sharedLink.filePath);
    const upstream = await fetch(filePath);

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ success: false, message: 'Unable to fetch shared document' });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const fileName = getDownloadFilename(contentType, getDocumentKind(filePath));

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSharedLink,
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument
};
