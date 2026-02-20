const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,              // Essential for filtering by user
    },
    action: {
      type: String,
      required: true,
      index: true,              // Good if you analyze by action type
    },
    vault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vault',
      // Sparse index because vault is optional
      index: { sparse: true },
    },
    metadata: {
      type: Object,
      default: {},
      // Consider defining a sub‑schema if metadata structure is known
    },
  },
  {
    timestamps: true,           // Adds createdAt & updatedAt
    collection: 'activity_logs',
  }
);

// Compound indexes for common query patterns
activityLogSchema.index({ user: 1, createdAt: -1 });  // User activity feed
activityLogSchema.index({ vault: 1, createdAt: -1 }); // Vault history
// Optional: TTL index to auto‑delete old logs after 30 days
// activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);