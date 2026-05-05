function trimTrailingSlash(value) {
  return value ? value.trim().replace(/\/+$/, '') : '';
}

function getConfiguredAppUrl() {
  const explicitUrl = trimTrailingSlash(process.env.APP_URL || process.env.FRONTEND_URL || '');

  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;
  }

  return '';
}

function getRequestOrigin(req) {
  const configuredUrl = getConfiguredAppUrl();

  if (configuredUrl) {
    return configuredUrl;
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto ? forwardedProto.split(',')[0] : req.protocol;

  return `${protocol}://${req.get('host')}`;
}

function buildAppUrl(req, path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getRequestOrigin(req)}${normalizedPath}`;
}

module.exports = {
  buildAppUrl,
  getConfiguredAppUrl,
  getRequestOrigin
};
