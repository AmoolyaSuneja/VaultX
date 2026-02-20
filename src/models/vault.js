const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    data: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: 'general'
    },

    tags: [
      {
        type: String
      }
    ],

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
