const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    vault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vault'
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'activity_logs'
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
