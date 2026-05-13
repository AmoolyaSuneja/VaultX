const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const asyncHandler = require('../Utils/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');

router.post(
  '/',
  protect,
  upload.singleGuarded('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError('Please upload a file', 400);
    }

    const uploadedUrl = req.file.secure_url || req.file.path || req.file.url;

    if (!uploadedUrl) {
      throw new HttpError('Upload succeeded but no file URL was returned', 500);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl: uploadedUrl,
        fileName: req.file.filename || req.file.originalname
      }
    });
  })
);

module.exports = router;
