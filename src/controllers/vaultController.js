const Vault = require('../models/Vault');

const previewVaultData = async (req, res) => {
  try {
    const { data } = req.body;

    const vaultEntry = new Vault({
      data: data,
      length: data.length,
      storedAt: new Date()
    });

    await vaultEntry.save();

    res.status(201).json({
      status: 'stored',
      id: vaultEntry._id,
      originalLength: vaultEntry.length,
      storedAt: vaultEntry.storedAt,
      note: 'Data stored successfully (encryption in next phase)'
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to store vault data'
    });
  }
};

module.exports = {
  previewVaultData
};