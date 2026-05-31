require('dotenv').config();
const { validateEnv } = require('./config/env');

validateEnv();

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const userRoutes = require('./routes/UserRoutes');
const activityRoutes = require('./routes/activityRoutes');
const sharedLinkRoutes = require('./routes/sharedLinkRoutes');
const nomineeRoutes = require('./routes/nomineeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const requestContext = require('./middleware/requestContext');
const { generalLimiter } = require('./middleware/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const frontendDistDir = path.join(__dirname, '..', 'frontend', 'dist');

// Trust a single proxy hop. Both Vercel and Lambda sit behind exactly one proxy,
// and locally there is no proxy so reading one hop is harmless. We deliberately
// avoid `true` because express-rate-limit refuses it (spoofable X-Forwarded-For).
// The rate limiters also disable trust-proxy validation as a second safeguard.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(requestContext);

morgan.token('id', (req) => req.id || '-');
app.use(
  morgan(isProduction ? ':id :method :url :status :res[content-length] - :response-time ms' : 'dev', {
    skip: (req) => req.originalUrl === '/api/health'
  })
);

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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', generalLimiter);

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

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
    version: '3.2.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vault: '/api/vault',
      activity: '/api/activity',
      shared: '/api/shared',
      nominee: '/api/nominee',
      upload: '/api/upload',
      health: '/api/health'
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

function registerGracefulShutdown(server) {
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Received ${signal}. Shutting down gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close(async (closeError) => {
      if (closeError) {
        console.error('Error closing HTTP server:', closeError.message);
      }

      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      } catch (dbError) {
        console.error('Error closing MongoDB connection:', dbError.message);
      }

      clearTimeout(forceExitTimer);
      process.exit(closeError ? 1 : 0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });
}

async function startServer() {
  try {
    const dbConnection = await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Connected database: ${dbConnection.name}`);
      console.log(`VaultX Home: http://localhost:${PORT}/`);
      console.log(`Health:      http://localhost:${PORT}/api/health`);
    });

    registerGracefulShutdown(server);
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
