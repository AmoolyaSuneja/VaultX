const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const { updateMeBody } = require('../validation/userSchemas');
const { getAllUsers, getMe, updateMe } = require('../controllers/UserController');

router.get('/', protect, requireAdmin, getAllUsers);
router.get('/me', protect, getMe);
router.put('/me', protect, validate({ body: updateMeBody }), updateMe);

module.exports = router;
