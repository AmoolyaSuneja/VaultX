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
    nominee: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      name: {
        type: String,
        default: '',
        trim: true
      },
      email: {
        type: String,
        default: '',
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid nominee email address']
      },
      relationship: {
        type: String,
        default: '',
        trim: true
      },
      condition: {
        type: String,
        enum: ['death', 'incapacity', 'inactivity', 'courtOrder', null],
        default: null
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'active', 'revoked'],
        default: 'pending',
        index: true
      },
      requestedAt: {
        type: Date,
        default: null
      },
      approvedAt: {
        type: Date,
        default: null
      },
      activatedAt: {
        type: Date,
        default: null
      },
      claim: {
        submittedAt: {
          type: Date,
          default: null
        },
        proofType: {
          type: String,
          default: '',
          trim: true
        },
        proofNotes: {
          type: String,
          default: '',
          trim: true
        },
        proofDocumentUrl: {
          type: String,
          default: '',
          trim: true
        },
        proofDocumentName: {
          type: String,
          default: '',
          trim: true
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        reviewedAt: {
          type: Date,
          default: null
        },
        activatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        activationNotes: {
          type: String,
          default: '',
          trim: true
        }
      }
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
