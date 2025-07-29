// backend/routes/api.js
const router = require('express').Router();
const verifyJWT = require('../middleware/verifyJWT');
const auth = require('../controllers/authController');
const quiz = require('../controllers/quizController');

// Public
router.post('/auth/signup', auth.signup);
router.post('/auth/login', auth.login);

// Protected
router.get('/quiz/types', verifyJWT, quiz.listTypes);
router.post('/quiz/session', verifyJWT, quiz.startSession);
router.get('/quiz/session/:id', verifyJWT, quiz.resumeSession);
router.put('/quiz/session/:id/answer', verifyJWT, quiz.saveAnswer);
router.post('/quiz/session/:id/finish', verifyJWT, quiz.finishSession);
router.get('/user/history', verifyJWT, quiz.history);

module.exports = router;