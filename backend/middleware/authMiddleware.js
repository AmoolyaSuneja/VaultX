const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { HttpError } = require('./errorHandler');

async function protect(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return next(new HttpError('Authentication required', 401));
  }

  const token = header.slice(7).trim();

  if (!token) {
    return next(new HttpError('Authentication required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new HttpError('Session is no longer valid', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new HttpError('Session expired. Please sign in again.', 401));
    }

    return next(new HttpError('Session is invalid. Please sign in again.', 401));
  }
}

module.exports = protect;
