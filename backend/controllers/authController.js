const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const { sendPasswordResetCodeEmail } = require('../Utils/email');

const TOKEN_TTL = '7d';
const RESET_TTL_MS = 10 * 60 * 1000;

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

  if (!name || !email || !password) {
    throw new HttpError('Name, email, and password are required', 400);
  }

  if (password.length < 8) {
    throw new HttpError('Password must be at least 8 characters', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    throw new HttpError('An account with that email already exists', 400);
  }

  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, password });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: toPublicUser(user)
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
  const isMatch = user && user.password ? await bcrypt.compare(password, user.password) : false;

  if (!isMatch) {
    throw new HttpError('Invalid credentials', 401);
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: toPublicUser(user)
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    throw new HttpError('Email is required', 400);
  }

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
    console.error('Password reset email failed:', emailError.message);

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
  const email = req.body.email?.trim().toLowerCase();
  const code = req.body.code?.trim();
  const { password } = req.body;

  if (!email || !code || !password) {
    throw new HttpError('Email, recovery code, and new password are required', 400);
  }

  if (!/^\d{6}$/.test(code)) {
    throw new HttpError('Enter a valid 6-digit recovery code', 400);
  }

  if (password.length < 8) {
    throw new HttpError('Password must be at least 8 characters', 400);
  }

  const user = await User.findOne({ email }).select('+password +passwordResetCodeHash +passwordResetExpiresAt');

  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
    throw new HttpError('Invalid or expired recovery code', 400);
  }

  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    await user.save({ validateBeforeSave: false });
    throw new HttpError('Recovery code has expired', 400);
  }

  if (user.passwordResetCodeHash !== hashResetCode(code)) {
    throw new HttpError('Invalid recovery code', 400);
  }

  user.password = password;
  user.passwordResetCodeHash = null;
  user.passwordResetExpiresAt = null;
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
