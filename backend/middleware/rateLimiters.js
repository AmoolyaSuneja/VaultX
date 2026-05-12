const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

const baseOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' }
};

const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 200,
  skipSuccessfulRequests: false
});

const passwordResetLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 8 : 100
});

const sharedLinkLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  max: isProduction ? 30 : 200
});

const generalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 600 : 5000
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  sharedLinkLimiter,
  generalLimiter
};
