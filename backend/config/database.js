// backend/config/database.js
require('dotenv').config();
const path = require('path');

// Absolute path to your SQLite file
const storagePath = path.join(__dirname, '..', 'database', 'quiz_app.db');

module.exports = {
  dialect: 'sqlite',
  storage: storagePath,
  logging: false            // set to console.log for SQL echo
};