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
      required: true,
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'vault_data'
  }
);

module.exports = mongoose.model('Vault', vaultSchema);
