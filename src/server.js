require('dotenv').config();
const express = require('express');
const vaultRoutes = require('./routes/vaultRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Routes
app.use('/api/vault', vaultRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Secure Vault API Server is running',
    version: '1.0.0',
    endpoints: {
      preview: 'POST /api/vault/preview'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📍 Vault endpoint: http://localhost:${PORT}/api/vault/preview`);
});

