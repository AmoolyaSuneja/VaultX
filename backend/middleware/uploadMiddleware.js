const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const multerCloudinary = require('multer-storage-cloudinary');
const { HttpError } = require('./errorHandler');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB combined per request
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);

function createOpaquePublicId() {
  return crypto.randomBytes(18).toString('hex');
}

function buildFileFilter() {
  return (req, file, cb) => {
    if (!file?.mimetype || !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      return cb(new HttpError('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF.', 400));
    }

    return cb(null, true);
  };
}

const storageOptions = {
  cloudinary: require('cloudinary'),
  params: (req, file, cb) => {
    cb(undefined, {
      folder: 'vaultx_uploads',
      allowed_formats: ALLOWED_FORMATS,
      resource_type: 'auto',
      public_id: createOpaquePublicId(),
      use_filename: false,
      unique_filename: false
    });
  }
};

let storage;
if (multerCloudinary.CloudinaryStorage) {
  storage = new multerCloudinary.CloudinaryStorage(storageOptions);
} else {
  storage = multerCloudinary(storageOptions);
}

const upload = multer({
  storage,
  fileFilter: buildFileFilter(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10,
    fields: 40
  }
});

function wrapMulterError(error) {
  if (!error) return error;
  if (error.code === 'LIMIT_FILE_SIZE') return new HttpError('Attachment exceeds the 10 MB size limit.', 413);
  if (error.code === 'LIMIT_FILE_COUNT') return new HttpError('Too many attachments in one request.', 400);
  if (error.code === 'LIMIT_UNEXPECTED_FILE') return new HttpError('Unexpected upload field.', 400);
  return error;
}

function withUploadGuards(middleware) {
  return (req, res, next) => {
    middleware(req, res, (error) => {
      if (error) return next(wrapMulterError(error));

      const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
      const totalBytes = files.reduce((total, file) => total + (file?.size || file?.bytes || 0), 0);

      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        return next(new HttpError('Combined attachments exceed the 50 MB request limit.', 413));
      }

      return next();
    });
  };
}

upload.arrayGuarded = (fieldName, maxCount) => withUploadGuards(upload.array(fieldName, maxCount));
upload.singleGuarded = (fieldName) => withUploadGuards(upload.single(fieldName));

module.exports = upload;
module.exports.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
module.exports.MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_BYTES;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
