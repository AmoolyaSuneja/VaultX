/**
 * Middleware to validate vault input
 * Ensures the request body contains a valid 'data' field (non-empty string)
 */
const validateVaultInput = (req, res, next) => {
  // Check if request body exists
  if (!req.body) {
    return res.status(400).json({
      status: 'error',
      message: 'Request body is required'
    });
  }

  // Check if 'data' field exists
  if (!req.body.hasOwnProperty('data')) {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" is required in request body'
    });
  }

  // Check if 'data' is a string
  if (typeof req.body.data !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" must be a string'
    });
  }

  // Check if 'data' is not empty
  if (req.body.data.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Field "data" cannot be empty'
    });
  }

  // Validation passed, proceed to next middleware/controller
  next();
};

module.exports = validateVaultInput;

