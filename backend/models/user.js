const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordResetCodeHash: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,         
    collection: 'users',
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
