const express = require('express');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
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

router.post('/', protect, registerNominee);
router.get('/', protect, getNomineeStatus);
router.get('/claims', protect, listNomineeClaims);
router.post('/claim', protect, upload.single('proofDocument'), claimNomineeAccess);
router.post('/approve', protect, approveNomineeClaim);
router.post('/activate', protect, activateNomineeAccess);
router.post('/revoke', protect, revokeNominee);

module.exports = router;
