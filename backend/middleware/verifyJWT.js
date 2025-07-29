// backend/middleware/verifyJWT.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;       // e.g. "Bearer eyJhb..."
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];             // Grab second chunk
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid/expired token' });
    req.user = decoded;                               // { id, username, iat, exp }
    next();
  });
}

module.exports = verifyJWT;