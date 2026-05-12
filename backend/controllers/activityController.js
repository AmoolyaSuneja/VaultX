const ActivityLog = require('../models/activitylog');
const asyncHandler = require('../Utils/asyncHandler');

const getMyActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find({ user: req.user._id })
    .populate('vault', '_id')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

module.exports = {
  getMyActivities
};
