const express = require('express');
const router = express.Router();
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const { registerUser, loginUser, requestPasswordReset, resetPassword } = require('../controllers/authController');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, resetPassword);

module.exports = router;
