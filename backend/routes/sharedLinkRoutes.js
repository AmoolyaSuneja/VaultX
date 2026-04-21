const express = require('express');
const router = express.Router();
const {
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument
} = require('../controllers/sharedLinkController');

router.get('/:shareId', getSharedLinkInfo);
router.post('/:shareId/verify', verifySharedLinkPassword);
router.get('/:shareId/download', downloadSharedDocument);

module.exports = router;
