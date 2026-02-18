const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema(
  {
    data: {
      type: String,
      required: true
    },
    length: {
      type: Number,
      required: true
    },
    storedAt: {
      type: Date,
      required: true
    }
  },
  {
    collection: 'vault_data' 
  }
);

module.exports = mongoose.model('Vault', vaultSchema);