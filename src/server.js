require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const vaultRoutes = require('./routes/vaultRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.get('/', (req, res) => {
  res.json({
    message: 'Secure Vault API Server is running',
    version: '1.0.0',
    endpoints: {
      preview: 'POST /api/vault/preview'
    }
  });
});

connectDB();

app.use('/api/vault', vaultRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Vault endpoint: http://localhost:${PORT}/api/vault/preview`);
});
