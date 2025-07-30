const express = require('express');
const router = express.Router();
const quiz = require('../controllers/quizController');

// Middleware to verify JWT (you should already have this)
const verifyJWT = (req, res, next) => {
  // Add your existing JWT verification logic here
  // For now, we'll just pass through - REPLACE THIS WITH YOUR ACTUAL JWT LOGIC
  next();
};

// Quiz routes
router.get('/quiz/types', quiz.getQuizTypes);
router.post('/quiz/session', verifyJWT, quiz.startSession);
router.post('/quiz/generate', verifyJWT, quiz.generateQuestions); // NEW ROUTE

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date().toISOString() });
});

module.exports = router;