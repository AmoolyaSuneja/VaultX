const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
const OPTIONAL_WITH_WARNING = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Set them in your .env or host environment before starting the server.`
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY?.trim();
  if (encryptionKey && !/^[0-9a-f]{64}$/i.test(encryptionKey)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('[env] JWT_SECRET is shorter than 32 characters. Use a long, random secret in production.');
  }

  const softMissing = OPTIONAL_WITH_WARNING.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (softMissing.length > 0) {
    console.warn(`[env] Optional variables not set: ${softMissing.join(', ')}. File uploads may be disabled.`);
  }
}

module.exports = { validateEnv };
