const previewVaultData = (req, res) => {
  const { data } = req.body;

  const originalLength = data.length;
  const storedAt = new Date().toISOString();

  const response = {
    status: 'received',
    originalLength: originalLength,
    storedAt: storedAt,
    note: 'Data will be encrypted in next phase'
  };

  res.status(200).json(response);
};

module.exports = {
  previewVaultData
};

