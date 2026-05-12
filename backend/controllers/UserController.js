const User = require('../models/user');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email role isActive createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    throw new HttpError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role
    }
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const updates = {};

  if (typeof name === 'string') {
    updates.name = name.trim();
  }
  if (typeof avatarUrl === 'string') {
    updates.avatarUrl = avatarUrl.trim();
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    throw new HttpError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role
    }
  });
});

module.exports = {
  getAllUsers,
  getMe,
  updateMe
};
