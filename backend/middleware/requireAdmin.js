const { HttpError } = require('./errorHandler');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new HttpError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new HttpError('Admin access required', 403));
  }

  return next();
}

module.exports = requireAdmin;
