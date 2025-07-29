// backend/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize } = require('./models');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// NO helmet, NO CSP, NO security headers in development
app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
app.use('/api', apiRouter);

// Serve built frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all for React Router (using Express 5.x syntax)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, async () => {
  console.log(`🚀 Server on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('📡 DB connected');
  } catch (err) {
    console.error('❌ DB error:', err);
  }
});