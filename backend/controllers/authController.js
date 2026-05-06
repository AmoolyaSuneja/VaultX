const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto');
const { sendPasswordResetCodeEmail } = require('../Utils/email');

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
    return 'Unable to authenticate with the email provider. Check SMTP_USER and SMTP_PASS. Gmail requires an app password, not your normal account password.';
  }

  return `Unable to send recovery email: ${error.message}`;
}

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpiresAt');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that account exists, a recovery code has been sent'
      });
    }

    const code = createResetCode();
    user.passwordResetCodeHash = hashResetCode(code);
    user.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetCodeEmail({
        to: user.email,
        name: user.name,
        code
      });
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

      return res.status(500).json({ success: false, message: getEmailFailureMessage(emailError) });
    }

    return res.status(200).json({
      success: true,
      message: 'Recovery code sent to your email'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const code = req.body.code?.trim();
    const { password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Email, recovery code, and new password are required' });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 6-digit recovery code' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email }).select('+password +passwordResetCodeHash +passwordResetExpiresAt');

    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired recovery code' });
    }

    if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      user.passwordResetCodeHash = null;
      user.passwordResetExpiresAt = null;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Recovery code has expired' });
    }

    if (user.passwordResetCodeHash !== hashResetCode(code)) {
      return res.status(400).json({ success: false, message: 'Invalid recovery code' });
    }

    user.password = password;
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword
};
