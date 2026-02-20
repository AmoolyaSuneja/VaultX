const ActivityLog = require('../models/activitylog');

const getAllActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .populate('user')
      .populate('vault')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllActivities
};