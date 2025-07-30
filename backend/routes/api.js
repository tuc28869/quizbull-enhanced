const express = require('express');
const router = express.Router();
const quiz = require('../controllers/quizController');

// Simple JWT middleware - replace with your actual implementation
const verifyJWT = (req, res, next) => {
  // For development, create a mock user - REPLACE WITH REAL JWT LOGIC
  req.user = { id: 1 };
  next();
};

// Quiz routes - DATABASE DRIVEN (NO MORE LLM API CALLS FOR QUIZ TAKING)
router.get('/quiz/types', quiz.getQuizTypes); // Get FINRA certifications from database
router.post('/quiz/questions', quiz.getQuestions); // NEW ROUTE - Get questions from database  
router.post('/quiz/session', verifyJWT, quiz.startSession); // Start session
router.post('/quiz/session/:sessionId/answer', verifyJWT, quiz.submitAnswer); // Submit answer
router.get('/quiz/session/:sessionId/results', verifyJWT, quiz.getSessionResults); // Get results

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Backend API is running',
    database: 'Connected to SQLite with FINRA certifications',
    endpoints: {
      'GET /quiz/types': 'Get FINRA certification types',
      'POST /quiz/questions': 'Get questions from database', 
      'POST /quiz/session': 'Start quiz session',
      'POST /quiz/session/:id/answer': 'Submit answer',
      'GET /quiz/session/:id/results': 'Get results'
    },
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;