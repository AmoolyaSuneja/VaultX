const express = require('express');
const router = express.Router();
const validateVaultInput = require('../middleware/validateVaultInput');
const { previewVaultData } = require('../controllers/vaultController');

router.post('/preview', validateVaultInput, previewVaultData);

module.exports = router;

