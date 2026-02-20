const Vault = require('../models/Vault');
const ActivityLog = require('../models/activitylog');

const createVaultEntry = async (req, res) => {
  try {
    const { title, data, category, tags, owner } = req.body;

    const vaultEntry = new Vault({
      title,
      data,
      length: data.length,
      category,
      tags,
      owner
    });

    await vaultEntry.save();

    await ActivityLog.create({
      user: owner,
      action: 'VAULT_CREATED',
      vault: vaultEntry._id,
      metadata: {
        title: title
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vault entry created successfully',
      data: vaultEntry
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllVaultEntries = async (req, res) => {
  try {
    const vaults = await Vault.find()
      .populate('owner')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createVaultEntry,
  getAllVaultEntries
};