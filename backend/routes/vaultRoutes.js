const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const {
  mutateBody,
  entryIdParams,
  attachmentParams,
  shareLinkBody,
  approveEmailBody,
  actionRequestBody,
  listQuery
} = require('../validation/vaultSchemas');
const { createSharedLink } = require('../controllers/sharedLinkController');
const {
  createVaultEntry,
  getVaultEntryById,
  getAllVaultEntries,
  updateVaultEntry,
  deleteVaultEntry,
  requestVaultAccessApproval,
  approveVaultAccessFromEmail,
  requestVaultActionApproval,
  approveVaultActionFromEmail,
  previewVaultAttachment,
  downloadVaultAttachment
} = require('../controllers/vaultController');

router.get('/', protect, validate({ query: listQuery }), getAllVaultEntries);
router.post('/approve-email', validate({ body: approveEmailBody }), approveVaultAccessFromEmail);
router.post('/approve-action', validate({ body: approveEmailBody }), approveVaultActionFromEmail);
router.get('/:id', protect, validate({ params: entryIdParams }), getVaultEntryById);
router.get(
  '/:id/attachments/:attachmentIndex/preview',
  protect,
  validate({ params: attachmentParams }),
  previewVaultAttachment
);
router.get(
  '/:id/attachments/:attachmentIndex/download',
  protect,
  validate({ params: attachmentParams }),
  downloadVaultAttachment
);
router.post(
  '/:id/request-approval',
  protect,
  validate({ params: entryIdParams }),
  requestVaultAccessApproval
);
router.post(
  '/:id/request-action',
  protect,
  validate({ params: entryIdParams, body: actionRequestBody }),
  requestVaultActionApproval
);
router.post('/', protect, upload.arrayGuarded('files', 10), validate({ body: mutateBody }), createVaultEntry);
router.post(
  '/:id/share-link',
  protect,
  validate({ params: entryIdParams, body: shareLinkBody }),
  createSharedLink
);
router.put(
  '/:id',
  protect,
  upload.arrayGuarded('files', 10),
  validate({ params: entryIdParams, body: mutateBody }),
  updateVaultEntry
);
router.delete('/:id', protect, validate({ params: entryIdParams }), deleteVaultEntry);

module.exports = router;
