const validateVaultInput = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      status: 'error',
      message: 'Request body is required'
    });
  }

  if (!req.body.hasOwnProperty('data')) {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" is required in request body'
    });
  }

  if (typeof req.body.data !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" must be a string'
    });
  }

  if (req.body.data.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" cannot be empty'
    });
  }

  next();
};

module.exports = validateVaultInput;

