const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const { sendPasswordResetCodeEmail } = require('../Utils/email');
const {
  MAX_FAILED_ATTEMPTS,
  isAccountLocked,
  getLockoutRemainingSeconds,
  recordFailedLogin,
  clearFailedLogins
} = require('../Utils/accountLockout');

const TOKEN_TTL = '7d';
const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

function createResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function isSmtpAuthError(error) {
  return error?.code === 'EAUTH' || /535|authentication failed|invalid login/i.test(error?.message || '');
}

function getEmailFailureMessage(error) {
  if (isSmtpAuthError(error)) {
    return 'Unable to authenticate with the email provider. Check SMTP credentials.';
  }

  return 'Unable to send recovery email. Please try again shortly.';
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role
  };
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new HttpError('An account with that email already exists', 400);
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: toPublicUser(user)
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockedUntil');

  if (!user) {
    throw new HttpError('Invalid credentials', 401);
  }

  if (isAccountLocked(user)) {
    const retrySeconds = getLockoutRemainingSeconds(user);
    const minutes = Math.ceil(retrySeconds / 60);
    res.setHeader('Retry-After', String(retrySeconds));
    throw new HttpError(
      `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      429
    );
  }

  const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;

  if (!isMatch) {
    await recordFailedLogin(user);

    if (isAccountLocked(user)) {
      const retrySeconds = getLockoutRemainingSeconds(user);
      const minutes = Math.ceil(retrySeconds / 60);
      res.setHeader('Retry-After', String(retrySeconds));
      throw new HttpError(
        `Too many failed attempts. Account locked for ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        429
      );
    }

    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts || 0));
    const hint = remaining > 0 && remaining <= 2 ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : '';
    throw new HttpError(`Invalid credentials.${hint}`, 401);
  }

  await clearFailedLogins(user);

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: toPublicUser(user)
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const genericResponse = {
    success: true,
    message: 'If that account exists, a recovery code has been sent'
  };

  const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpiresAt');

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const code = createResetCode();
  user.passwordResetCodeHash = hashResetCode(code);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  user.passwordResetAttempts = 0;
  await user.save({ validateBeforeSave: false });

  try {
    const emailResult = await sendPasswordResetCodeEmail({
      to: user.email,
      name: user.name,
      code
    });

    if (emailResult?.skipped) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Development password reset fallback for ${user.email}: ${code}`);
        return res.status(200).json({
          success: true,
          message: 'Email is not configured, so the recovery code is shown for local development',
          recoveryCode: code
        });
      }

      throw new HttpError('Email is not configured on the server.', 500);
    }
  } catch (emailError) {
    console.error('Password reset email failed:', {
      code: emailError?.code,
      command: emailError?.command,
      responseCode: emailError?.responseCode,
      response: emailError?.response,
      message: emailError?.message
    });

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Development password reset fallback for ${user.email}: ${code}`);
      return res.status(200).json({
        success: true,
        message: 'Email delivery failed, so the recovery code is shown for local development',
        recoveryCode: code
      });
    }

    throw new HttpError(getEmailFailureMessage(emailError), 500);
  }

  return res.status(200).json(genericResponse);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const user = await User.findOne({ email }).select(
    '+password +passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts +failedLoginAttempts +lockedUntil'
  );

  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
    throw new HttpError('Invalid or expired recovery code', 400);
  }

  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetAttempts = 0;
    await user.save({ validateBeforeSave: false });
    throw new HttpError('Recovery code has expired', 400);
  }

  if ((user.passwordResetAttempts || 0) >= MAX_RESET_ATTEMPTS) {
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetAttempts = 0;
    await user.save({ validateBeforeSave: false });
    throw new HttpError('Too many incorrect attempts. Request a new recovery code.', 400);
  }

  if (user.passwordResetCodeHash !== hashResetCode(code)) {
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });

    const remaining = Math.max(0, MAX_RESET_ATTEMPTS - user.passwordResetAttempts);
    const hint = remaining > 0 && remaining <= 2 ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : '';
    throw new HttpError(`Invalid recovery code.${hint}`, 400);
  }

  user.password = password;
  user.passwordResetCodeHash = null;
  user.passwordResetExpiresAt = null;
  user.passwordResetAttempts = 0;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword
};
