const Vault = require('../models/vault');
const ActivityLog = require('../models/activitylog');
const { decrypt, encrypt } = require('../Utils/encryption');

// Decrypt data when sending to frontend.
const formatVaultEntry = (vaultEntry) => {
  const formattedEntry = vaultEntry.toObject();
  formattedEntry.title = decrypt(formattedEntry.title);
  formattedEntry.data = decrypt(formattedEntry.data);
  formattedEntry.password = decrypt(formattedEntry.password);
  formattedEntry.notes = decrypt(formattedEntry.notes);
  formattedEntry.filePath = (formattedEntry.filePath || []).map((filePath) => decrypt(filePath));
  return formattedEntry;
};

const createVaultEntry = async (req, res) => {
  try {
    const { title, data, category, tags, url, username, password, notes } = req.body;

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

    res.status(201).json({
      success: true,
      message: 'Vault entry created successfully',
      data: formatVaultEntry(vaultEntry)
    });
  } catch (error) {
    console.error('UPLOAD ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVaultEntryById = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id).populate('owner', 'name email');

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (vaultEntry.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this entry' });
    }

    return res.status(200).json({
      success: true,
      data: formatVaultEntry(vaultEntry)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllVaultEntries = async (req, res) => {
  try {
    const vaults = await Vault.find({ owner: req.user._id })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults.map(formatVaultEntry)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateVaultEntry = async (req, res) => {
  try {
    const vaultEntry = await Vault.findById(req.params.id);

    if (!vaultEntry) {
      return res.status(404).json({ success: false, message: 'Vault entry not found' });
    }

    if (vaultEntry.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this entry' });
    }

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
    vaultEntry.data = req.body.data || req.body.notes || vaultEntry.data || '';
    vaultEntry.filePath = uploadedFiles;

    await vaultEntry.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'VAULT_UPDATED',
      vault: vaultEntry._id,
      metadata: { title: vaultEntry.title }
    });

    res.status(200).json({
      success: true,
      data: formatVaultEntry(vaultEntry)
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

    if (vaultEntry.owner.toString() !== req.user._id.toString()) {
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

module.exports = {
  createVaultEntry,
  getVaultEntryById,
  getAllVaultEntries,
  updateVaultEntry,
  deleteVaultEntry
};
