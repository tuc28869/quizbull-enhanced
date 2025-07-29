// backend/controllers/quizController.js
const { sequelize, QuizType, Question, QuizSession, SessionQuestion, UserProgress } = require('../models');
const { Op } = require('sequelize');

// GET /api/quiz/types
exports.listTypes = async (_req, res) => {
  const types = await QuizType.findAll({
    attributes: ['id', 'name', 'displayName', 'totalQuestions']
  });
  res.json(types);
};

// POST /api/quiz/session   { quiz_type_id, mode } -> { session_id }
exports.startSession = async (req, res) => {
  const { quiz_type_id, mode } = req.body;
  const quizType = await QuizType.findByPk(quiz_type_id);
  if (!quizType) return res.status(404).json({ message: 'Quiz type not found' });

  // 1 – calculate batch size  
  const totalQuestions = mode === 'segmented' ? 10 : quizType.totalQuestions;

  // 2 – random question pool  
  const pool = await Question.findAll({
    where: { quizTypeId: quiz_type_id },
    order: sequelize.random(),
    limit: quizType.totalQuestions
  });

  // 3 – persist session & session_questions  
  const session = await sequelize.transaction(async t => {
    const s = await QuizSession.create(
      {
        userId: req.user.id,
        quizTypeId: quiz_type_id,
        sessionType: mode,
        totalQuestions: quizType.totalQuestions
      },
      { transaction: t }
    );

    await Promise.all(
      pool.map((q, idx) =>
        SessionQuestion.create(
          {
            sessionId: s.id,
            questionId: q.id,
            questionOrder: idx + 1
          },
          { transaction: t }
        )
      )
    );

    return s;
  });

  // 4 – return first block  
  const block = await SessionQuestion.findAll({
    where: { sessionId: session.id, questionOrder: { [Op.lte]: totalQuestions } },
    include: [{ model: Question }]
  });

  res.status(201).json({
    session_id: session.id,
    questions: block.map(record => ({
      id: record.questionId,
      order: record.questionOrder,
      questionText: record.Question.questionText,
      options: {
        A: record.Question.optionA,
        B: record.Question.optionB,
        C: record.Question.optionC,
        D: record.Question.optionD
      }
    }))
  });
};

// GET /api/quiz/session/:id
exports.resumeSession = async (req, res) => {
  const { id } = req.params;
  const session = await QuizSession.findByPk(id);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const answeredCount = await SessionQuestion.count({
    where: { sessionId: id, userAnswer: { [Op.not]: null } }
  });

  const nextBatchStart = answeredCount + 1;
  const nextBatchEnd =
    session.sessionType === 'segmented'
      ? Math.min(answeredCount + 10, session.totalQuestions)
      : session.totalQuestions;

  const records = await SessionQuestion.findAll({
    where: {
      sessionId: id,
      questionOrder: { [Op.between]: [nextBatchStart, nextBatchEnd] }
    },
    include: [{ model: Question }]
  });

  res.json(
    records.map(rec => ({
      id: rec.questionId,
      order: rec.questionOrder,
      questionText: rec.Question.questionText,
      options: {
        A: rec.Question.optionA,
        B: rec.Question.optionB,
        C: rec.Question.optionC,
        D: rec.Question.optionD
      }
    }))
  );
};

// PUT /api/quiz/session/:id/answer   { question_id, userAnswer }
exports.saveAnswer = async (req, res) => {
  const sessionId = req.params.id;
  const { question_id, userAnswer } = req.body;

  const record = await SessionQuestion.findOne({
    where: { sessionId, questionId: question_id },
    include: [{ model: Question }]
  });

  if (!record) return res.status(404).json({ message: 'Question not in session' });
  if (record.userAnswer)
    return res.status(409).json({ message: 'Answer already submitted' });

  const correct = record.Question.correctAnswer === userAnswer;
  record.userAnswer = userAnswer;
  record.isCorrect = correct;
  record.answeredAt = new Date();
  await record.save();

  // Update parent session counters atomically
  const session = await QuizSession.findByPk(sessionId);
  if (correct) session.correctAnswers += 1;
  session.currentQuestion += 1;
  await session.save();

  res.json({
    is_correct: correct,
    cumulative_correct: session.correctAnswers,
    answered: session.currentQuestion,
    total: session.totalQuestions
  });
};

// POST /api/quiz/session/:id/finish
exports.finishSession = async (req, res) => {
  const session = await QuizSession.findByPk(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.isCompleted)
    return res.status(409).json({ message: 'Session already finished' });

  session.endTime = new Date();
  session.isCompleted = true;
  session.scorePercentage =
    (session.correctAnswers / session.totalQuestions) * 100;
  await session.save();

  // Update user progress
  const progress = await UserProgress.findOne({
    where: { userId: session.userId, quizTypeId: session.quizTypeId }
  });
  progress.totalAttempts += 1;
  progress.latestScore = session.scorePercentage;
  progress.lastAttemptDate = new Date();
  if (session.scorePercentage > progress.bestScore)
    progress.bestScore = session.scorePercentage;
  progress.totalCorrect += session.correctAnswers;
  progress.totalQuestions += session.totalQuestions;
  await progress.save();

  res.json({
    final_score: session.scorePercentage,
    correct: session.correctAnswers,
    total: session.totalQuestions
  });
};

// GET /api/user/history?limit=&page=
exports.history = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const { count, rows } = await QuizSession.findAndCountAll({
    where: { userId: req.user.id, isCompleted: true },
    order: [['endTime', 'DESC']],
    limit,
    offset,
    include: [{ model: QuizType }]
  });

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    sessions: rows.map(s => ({
      id: s.id,
      exam: s.QuizType.displayName,
      score: s.scorePercentage,
      date: s.endTime
    }))
  });
};