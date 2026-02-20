const express = require('express');
const router = express.Router();

const { getAllActivities } = require('../controllers/activityController');

router.get('/', getAllActivities);

module.exports = router;