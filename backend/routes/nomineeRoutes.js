const express = require('express');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const {
  registerBody,
  claimBody,
  approveBody,
  activateBody
} = require('../validation/nomineeSchemas');
const {
  registerNominee,
  getNomineeStatus,
  claimNomineeAccess,
  listNomineeClaims,
  approveNomineeClaim,
  activateNomineeAccess,
  revokeNominee
} = require('../controllers/nomineeController');

const router = express.Router();

router.post('/', protect, validate({ body: registerBody }), registerNominee);
router.get('/', protect, getNomineeStatus);
router.get('/claims', protect, listNomineeClaims);
router.post(
  '/claim',
  protect,
  upload.single('proofDocument'),
  validate({ body: claimBody }),
  claimNomineeAccess
);
router.post('/approve', protect, validate({ body: approveBody }), approveNomineeClaim);
router.post('/activate', protect, validate({ body: activateBody }), activateNomineeAccess);
router.post('/revoke', protect, revokeNominee);

module.exports = router;
