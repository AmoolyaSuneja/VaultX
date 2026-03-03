const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    vault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vault',
      index: { sparse: true }
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

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ vault: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);