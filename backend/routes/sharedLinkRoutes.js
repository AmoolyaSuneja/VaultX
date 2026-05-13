const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { sharedLinkLimiter } = require('../middleware/rateLimiters');
const { shareIdParams, verifyBody, tokenQuery } = require('../validation/sharedSchemas');
const {
  getSharedLinkInfo,
  verifySharedLinkPassword,
  downloadSharedDocument,
  previewSharedDocument
} = require('../controllers/sharedLinkController');

router.get('/:shareId', validate({ params: shareIdParams }), getSharedLinkInfo);
router.post(
  '/:shareId/verify',
  sharedLinkLimiter,
  validate({ params: shareIdParams, body: verifyBody }),
  verifySharedLinkPassword
);
router.get(
  '/:shareId/preview',
  validate({ params: shareIdParams, query: tokenQuery }),
  previewSharedDocument
);
router.get(
  '/:shareId/download',
  validate({ params: shareIdParams, query: tokenQuery }),
  downloadSharedDocument
);

module.exports = router;
