const mongoose = require('mongoose');
const { encrypt } = require('../Utils/encryption');

const sharedLinkSchema = new mongoose.Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    vault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vault',
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    filePath: {
      type: String,
      required: true,
      set: (value) => {
        if (value === undefined || value === null || value === '') return value;
        return encrypt(value);
      }
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'shared_links'
  }
);

module.exports = mongoose.model('SharedLink', sharedLinkSchema);
