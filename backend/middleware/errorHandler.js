class HttpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

function notFoundHandler(req, res, next) {
  if (res.headersSent) {
    return next();
  }

  res.status(404).json({ success: false, message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const hasStatus = Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 600;
  const statusCode = hasStatus ? err.statusCode : 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  if (!isProduction) {
    console.error('[error]', req.method, req.originalUrl, err);
  } else if (!isClientError) {
    console.error('[error]', req.method, req.originalUrl, err?.message || err);
  }

  const fallback = isClientError ? err.message : 'Something went wrong. Please try again.';
  const message = typeof err?.message === 'string' && err.message ? (isClientError ? err.message : fallback) : fallback;

  res.status(statusCode).json({ success: false, message });
}

module.exports = {
  HttpError,
  errorHandler,
  notFoundHandler
};
