function trimTrailingSlash(value) {
  return value ? value.trim().replace(/\/+$/, '') : '';
}

function getValidOrigin(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(value.trim());

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return trimTrailingSlash(parsed.origin);
  } catch {
    return '';
  }
}

function getConfiguredAppUrl() {
  const explicitUrl = getValidOrigin(process.env.APP_URL || process.env.FRONTEND_URL || '');

  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;
  }

  return '';
}

function getRequestOrigin(req) {
  const browserOrigin = getValidOrigin(req.get('x-app-origin') || req.get('origin') || '');

  if (browserOrigin) {
    return browserOrigin;
  }

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
  getRequestOrigin,
  getValidOrigin
};
