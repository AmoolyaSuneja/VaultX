require('dotenv').config();
const uploadRoutes = require('./routes/uploadRoutes');
const express = require('express');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const userRoutes = require('./routes/UserRoutes');
const activityRoutes = require('./routes/activityRoutes');
const sharedLinkRoutes = require('./routes/sharedLinkRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistDir = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendDistDir));

app.post('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    body: req.body
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Secure Vault API is running',
    version: '3.0.0',
    endpoints: {
      users: '/api/users',
      vault: '/api/vault',
      activity: '/api/activity'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shared', sharedLinkRoutes);

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
      console.log(`VaultX Home:   http://localhost:${PORT}/`);
      console.log(`Auth Register: http://localhost:${PORT}/api/auth/register`);
      console.log(`Auth Login:    http://localhost:${PORT}/api/auth/login`);
      console.log(`Users API:     http://localhost:${PORT}/api/users`);
      console.log(`Vault API:     http://localhost:${PORT}/api/vault`);
      console.log(`Upload API:    http://localhost:${PORT}/api/upload`);
      console.log(`Activity API:  http://localhost:${PORT}/api/activity`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
