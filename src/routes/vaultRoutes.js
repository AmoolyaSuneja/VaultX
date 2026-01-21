const express = require('express');
const router = express.Router();
const validateVaultInput = require('../middleware/validateVaultInput');
const { previewVaultData } = require('../controllers/vaultController');

/**
 * POST /api/vault/preview
 * Accepts vault data, validates it, processes it, and returns metadata
 * 
 * Request Body:
 * {
 *   "data": "string"
 * }
 * 
 * Response:
 * {
 *   "status": "received",
 *   "originalLength": number,
 *   "storedAt": "ISO timestamp",
 *   "note": "Data will be encrypted in next phase"
 * }
 */
router.post('/preview', validateVaultInput, previewVaultData);

module.exports = router;

