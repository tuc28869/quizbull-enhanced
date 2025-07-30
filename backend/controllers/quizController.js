// backend/controllers/quizController.js

const {
  QuizType,
  Question,
  QuizSession,
  SessionQuestion,
  UserProgress
} = require('../models');

// 1️⃣ Get FINRA certification types
exports.getQuizTypes = async (req, res) => {
  try {
    const quizTypes = await QuizType.findAll({
      attributes: [
        'id',
        'name',
        'displayName',
        'totalQuestions',
        'passingScore',
        'timeLimit',
        'description'
      ],
      order: [['name', 'ASC']]
    });
    return res.json(quizTypes);
  } catch (err) {
    console.error('getQuizTypes error:', err);
    return res.status(500).json({ message: 'Failed to fetch quiz types' });
  }
};

// 2️⃣ Get questions for a given quiz type
exports.getQuestions = async (req, res) => {
  try {
    const { quiz_type_id, mode, count } = req.body;
    if (!quiz_type_id) {
      return res.status(400).json({ message: 'quiz_type_id is required' });
    }

    const qt = await QuizType.findByPk(quiz_type_id);
    if (!qt) {
      return res.status(404).json({ message: 'Quiz type not found' });
    }

    const limit =
      mode === 'segmented' ? Math.min(count || 10, 10) : qt.totalQuestions;

    const questions = await Question.findAll({
      where: { quizTypeId: quiz_type_id },
      order: [['id', 'ASC']],
      limit,
      attributes: [
        'id',
        'questionText',
        'optionA',
        'optionB',
        'optionC',
        'optionD',
        'correctAnswer',
        'explanation'
      ]
    });

    const formatted = questions.map(q => ({
      id: q.id,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
      explanation: q.explanation
    }));

    return res.json({ questions: formatted, count: formatted.length });
  } catch (err) {
    console.error('getQuestions error:', err);
    return res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

// 3️⃣ Start a quiz session
exports.startSession = async (req, res) => {
  try {
    const { quiz_type_id, mode, count } = req.body;
    if (!quiz_type_id || !mode) {
      return res
        .status(400)
        .json({ message: 'quiz_type_id and mode are required' });
    }

    const qt = await QuizType.findByPk(quiz_type_id);
    if (!qt) {
      return res.status(404).json({ message: 'Quiz type not found' });
    }

    const questionCount =
      mode === 'segmented' ? Math.min(count || 10, 10) : qt.totalQuestions;

    const session = await QuizSession.create({
      userId: req.user?.id || 1,
      quizTypeId: quiz_type_id,
      sessionType: mode,
      totalQuestions: questionCount,
      startTime: new Date(),
      isCompleted: false
    });

    return res.json({
      session_id: session.id,
      quiz_type_id,
      mode,
      totalQuestions: questionCount,
      started_at: session.startTime
    });
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({ message: 'Failed to start session' });
  }
};

// 4️⃣ Submit an answer
exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;
    if (!sessionId || !questionId || answer === undefined) {
      return res
        .status(400)
        .json({ message: 'sessionId, questionId, and answer are required' });
    }

    const session = await QuizSession.findByPk(sessionId);
    if (!session || session.isCompleted) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const q = await Question.findByPk(questionId);
    if (!q) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
    const isCorrect = answer === correctIdx;

    await SessionQuestion.create({
      sessionId: sessionId,
      questionId: questionId,
      questionOrder: session.totalQuestions ? session.totalQuestions + 1 : 1,
      userAnswer: answer,
      isCorrect: isCorrect,
      answeredAt: new Date()
    });

    return res.json({ success: true, isCorrect });
  } catch (err) {
    console.error('submitAnswer error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to submit answer', details: err.message });
  }
};

// 5️⃣ Get session results
exports.getSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await QuizSession.findByPk(sessionId, {
      include: [{ model: QuizType }]
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const answers = await SessionQuestion.findAll({
      where: { sessionId: sessionId },
      include: [
        {
          model: Question,
          attributes: ['questionText', 'correctAnswer', 'explanation']
        }
      ]
    });

    const total = answers.length;
    const correct = answers.filter(a => a.isCorrect).length;
    const score = total ? Math.round((correct / total) * 100) : 0;

    await session.update({
      isCompleted: true,
      completedAt: new Date(),
      score
    });

    const results = answers.map(a => ({
      questionId: a.questionId,
      questionText: a.Question.questionText,
      userAnswer: a.userAnswer,
      correctAnswer: ['A', 'B', 'C', 'D'].indexOf(
        a.Question.correctAnswer
      ),
      isCorrect: a.isCorrect,
      explanation: a.Question.explanation
    }));

    return res.json({
      sessionId: sessionId,
      totalQuestions: total,
      correctAnswers: correct,
      score,
      questionResults: results
    });
  } catch (err) {
    console.error('getSessionResults error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to get session results', details: err.message });
  }
};

// 6️⃣ Get user progress (optional)
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const progress = await UserProgress.findAll({
      where: { userId },
      include: [{ model: QuizType, attributes: ['displayName'] }]
    });

    return res.json(progress);
  } catch (err) {
    console.error('getUserProgress error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch progress', details: err.message });
  }
};
