const crypto = require('crypto');

function requestContext(req, res, next) {
  const headerId = req.get('x-request-id');
  const id = typeof headerId === 'string' && headerId.length > 0 && headerId.length <= 128 ? headerId : crypto.randomBytes(8).toString('hex');

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestContext;
