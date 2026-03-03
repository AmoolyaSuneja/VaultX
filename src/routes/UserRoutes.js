const express = require('express');
const router = express.Router();
const { createUser, registerUser, getAllUsers } = require('../controllers/UserController');

router.post('/register', registerUser);
router.post('/', createUser);
router.get('/', getAllUsers);

module.exports = router;