const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody
} = require('../validation/authSchemas');
const {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

router.post('/register', authLimiter, validate({ body: registerBody }), registerUser);
router.post('/login', authLimiter, validate({ body: loginBody }), loginUser);
router.post('/forgot-password', passwordResetLimiter, validate({ body: forgotPasswordBody }), requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, validate({ body: resetPasswordBody }), resetPassword);

module.exports = router;
