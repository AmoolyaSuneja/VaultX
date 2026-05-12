require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const userRoutes = require('./routes/UserRoutes');
const activityRoutes = require('./routes/activityRoutes');
const sharedLinkRoutes = require('./routes/sharedLinkRoutes');
const nomineeRoutes = require('./routes/nomineeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { generalLimiter } = require('./middleware/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistDir = path.join(__dirname, '..', 'frontend', 'dist');

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(frontendDistDir));

app.use('/api', generalLimiter);

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Secure Vault API is running',
    version: '3.1.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vault: '/api/vault',
      activity: '/api/activity',
      shared: '/api/shared',
      nominee: '/api/nominee',
      upload: '/api/upload'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shared', sharedLinkRoutes);
app.use('/api/nominee', nomineeRoutes);

app.use('/api', notFoundHandler);
app.use('/api', errorHandler);

app.get('*', (req, res) => {
  if (!fs.existsSync(frontendDistDir)) {
    return res.status(503).json({
      message: 'Frontend build not found. Run `npm run build` or `npm run dev:frontend`.'
    });
  }

  res.sendFile(path.join(frontendDistDir, 'index.html'));
});

async function startServer() {
  try {
    const dbConnection = await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Connected database: ${dbConnection.name}`);
      console.log(`VaultX Home: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
