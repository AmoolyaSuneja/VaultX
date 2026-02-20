require('dotenv').config();
const activityRoutes = require('./routes/activityRoutes');
const express = require('express');
const connectDB = require('./config/db');

const vaultRoutes = require('./routes/vaultRoutes');
const userRoutes = require('./routes/UserRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    body: req.body
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Secure Vault API is running',
    version: '2.0.0',
    endpoints: {
      users: '/api/users',
      vault: '/api/vault'
    }
  });
});


connectDB();

app.use('/api/users', userRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/activity', activityRoutes);

app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/`);
  console.log(` Users API: http://localhost:${PORT}/api/users`);
  console.log(` Vault API: http://localhost:${PORT}/api/vault`);
});