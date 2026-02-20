const mongoose = require('mongoose');

const validateVaultInput = (req, res, next) => {
  const { title, data, owner } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid "title" is required'
    });
  }

  if (!data || typeof data !== 'string' || data.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid "data" is required'
    });
  }

  if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
    return res.status(400).json({
      success: false,
      message: 'Valid "owner" ObjectId is required'
    });
  }

  next();
};

module.exports = validateVaultInput;
