const express = require('express');
const router = express.Router();
const { sharedLinkLimiter } = require('../middleware/rateLimiters');
const {
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument,
  previewSharedDocument
} = require('../controllers/sharedLinkController');

router.get('/:shareId', getSharedLinkInfo);
router.post('/:shareId/verify', sharedLinkLimiter, verifySharedLinkPassword);
router.get('/:shareId/preview', previewSharedDocument);
router.get('/:shareId/download', downloadSharedDocument);

module.exports = router;
