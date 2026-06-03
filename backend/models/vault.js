const mongoose = require('mongoose');
const { encrypt } = require('../Utils/encryption');

function encryptArray(values) {
  if (!Array.isArray(values)) {
    return values;
  }

  return values.map((value) => {
    if (value === undefined || value === null || value === '') {
      return value;
    }

    return encrypt(value);
  });
}

const vaultSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      set: (value) => {
        if (value === undefined || value === null || value === '') return value;
        return encrypt(value);
      }
    },
    data: {
      type: String,
      default: '',
      set: (value) => {
        if (value === undefined || value === null) return value;
        return encrypt(value); 
      }
    },
    category: {
      type: String,
      default: 'General'
    },
    url: {
      type: String,
      default: ''
    },
    username: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: '',
      set: (value) => {
        if (value === undefined || value === null || value === '') return value;
        return encrypt(value);
      }
    },
    notes: {
      type: String,
      default: '',
      set: (value) => {
        if (value === undefined || value === null || value === '') return value;
        return encrypt(value);
      }
    },
    tags: [
      {
        type: String
      }
    ],
    filePath: {
      type: [String],
      default: [],
      set: encryptArray
    },
    unlockAt: {
      type: Date,
      default: null
    },
    requiresDualApproval: {
      type: Boolean,
      default: false
    },
    secondApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    dualAccess: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      requestedAt: {
        type: Date,
        default: null
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      approvedAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      }
    },
    // Tracks a pending per-action approval (download / share) requested by one
    // participant that the other participant must approve via email before the
    // action can proceed.
    actionRequest: {
      action: {
        type: String,
        enum: ['download', 'share'],
        default: null
      },
      attachmentIndex: {
        type: Number,
        default: null
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      requestedAt: {
        type: Date,
        default: null
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      approvedAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'vault_data'
  }
);

vaultSchema.index({ owner: 1, createdAt: -1 });
vaultSchema.index({ secondApprover: 1, createdAt: -1 });
vaultSchema.index({ 'dualAccess.expiresAt': 1 });

module.exports = mongoose.model('Vault', vaultSchema);
