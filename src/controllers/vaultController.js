const previewVaultData = (req, res) => {
  const { data } = req.body;

  const originalLength = data.length;
  const storedAt = new Date().toISOString();

  const response = {
    status: 'received',
    originalLength: originalLength,
    storedAt: storedAt,
    note: 'Data accepted and processed'
  };

  res.status(200).json(response);
};

module.exports = {
  previewVaultData
};

