console.log("routes loaded");
const express = require('express');
const router = express.Router();
const validateVaultInput = require('../middleware/validateVaultInput');

const {
  createVaultEntry,
  getAllVaultEntries
} = require('../controllers/vaultController');

router.post('/', validateVaultInput, createVaultEntry);
router.get('/', getAllVaultEntries);

module.exports = router;