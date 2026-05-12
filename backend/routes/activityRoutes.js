const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getMyActivities } = require('../controllers/activityController');

router.get('/', protect, getMyActivities);

module.exports = router;
