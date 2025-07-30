const { QuizType, Question, User, UserProgress, QuizSession, SessionQuestion } = require('../models');
const { Op } = require('sequelize');

// Get quiz types from database (FINRA certifications)
exports.getQuizTypes = async (req, res) => {
  try {
    const quizTypes = await QuizType.findAll({
      attributes: ['id', 'name', 'displayName', 'totalQuestions', 'passingScore', 'timeLimit', 'description'],
      order: [['name', 'ASC']]
    });
    
    console.log(`Retrieved ${quizTypes.length} FINRA quiz types from database`);
    res.json(quizTypes);
  } catch (error) {
    console.error('Error fetching quiz types:', error);
    res.status(500).json({ 
      message: 'Failed to fetch quiz types from database', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
};

// Get questions from database for a specific quiz type
exports.getQuestions = async (req, res) => {
  try {
    const { quiz_type_id, mode, count } = req.body;
    
    if (!quiz_type_id) {
      return res.status(400).json({ message: 'Quiz type ID is required' });
    }

    // Verify quiz type exists
    const quizType = await QuizType.findByPk(quiz_type_id);
    if (!quizType) {
      return res.status(404).json({ message: 'Quiz type not found' });
    }

    // Determine how many questions to fetch
    let questionCount;
    if (mode === 'segmented' || mode === 'practice') {
      questionCount = Math.min(count || 10, 10); // Max 10 for practice mode
    } else {
      questionCount = Math.min(count || quizType.totalQuestions, quizType.totalQuestions);
    }

    // Fetch questions from database - order by random for variety
    const questions = await Question.findAll({
      where: { quizTypeId: quiz_type_id },
      order: [['id', 'ASC']], // For now use sequential, could add randomization later
      limit: questionCount,
      attributes: [
        'id', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD', 
        'correctAnswer', 'explanation', 'topic', 'difficultyLevel'
      ]
    });

    if (questions.length === 0) {
      return res.status(404).json({ 
        message: `No questions found for ${quizType.name}. Please run the database seeding script: node scripts/seedDatabase.js` 
      });
    }

    console.log(`Retrieved ${questions.length} questions for ${quizType.name} from database`);

    // Format questions for frontend (convert correctAnswer letter to index)
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficultyLevel
    }));

    res.json({
      questions: formattedQuestions,
      count: formattedQuestions.length,
      quizType: {
        id: quizType.id,
        name: quizType.name,
        displayName: quizType.displayName,
        totalQuestions: quizType.totalQuestions
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch questions from database',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
};

// Start quiz session with database integration
exports.startSession = async (req, res) => {
  try {
    const { quiz_type_id, mode } = req.body;
    const userId = req.user?.id || 1; // Default to user 1 for now
    
    if (!quiz_type_id || !mode) {
      return res.status(400).json({ message: 'Quiz type and mode are required' });
    }

    // Verify quiz type exists
    const quizType = await QuizType.findByPk(quiz_type_id);
    if (!quizType) {
      return res.status(404).json({ message: 'Quiz type not found in database' });
    }

    // Create quiz session in database
    const session = await QuizSession.create({
      userId: userId,
      quizTypeId: quiz_type_id,
      mode: mode,
      startedAt: new Date(),
      status: 'active'
    });

    console.log(`Started ${mode} session for ${quizType.name} (Session ID: ${session.id})`);

    res.json({
      session_id: session.id,
      quiz_type_id: quiz_type_id,
      mode: mode,
      started_at: session.startedAt,
      quiz_type_name: quizType.name,
      quiz_type_display: quizType.displayName
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ 
      message: 'Failed to start quiz session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
};

// Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;

    if (!sessionId || !questionId || answer === undefined) {
      return res.status(400).json({ message: 'Session ID, question ID, and answer are required' });
    }

    // Verify session exists and is active
    const session = await QuizSession.findByPk(sessionId);
    if (!session || session.status !== 'active') {
      return res.status(404).json({ message: 'Active session not found' });
    }

    // Get the question to check correct answer
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
    const isCorrect = answer === correctAnswerIndex;

    // Save the answer
    await SessionQuestion.create({
      sessionId: sessionId,
      questionId: questionId,
      userAnswer: answer,
      isCorrect: isCorrect,
      answeredAt: new Date()
    });

    console.log(`Answer submitted for session ${sessionId}, question ${questionId}: ${answer} (${isCorrect ? 'Correct' : 'Incorrect'})`);

    res.json({
      success: true,
      sessionId: sessionId,
      questionId: questionId,
      answer: answer,
      isCorrect: isCorrect,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
};

// Get session results
exports.getSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Get session with quiz type info
    const session = await QuizSession.findByPk(sessionId, {
      include: [{ model: QuizType, attributes: ['name', 'displayName', 'passingScore'] }]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get all answers for this session
    const sessionQuestions = await SessionQuestion.findAll({
      where: { sessionId: sessionId },
      include: [{
        model: Question,
        attributes: ['questionText', 'correctAnswer', 'explanation']
      }]
    });

    const totalQuestions = sessionQuestions.length;
    const correctAnswers = sessionQuestions.filter(sq => sq.isCorrect).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = score >= session.QuizType.passingScore;

    // Update session status
    await session.update({
      status: 'completed',
      completedAt: new Date(),
      score: score
    });

    res.json({
      sessionId: sessionId,
      quizType: session.QuizType.displayName,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      score: score,
      passingScore: session.QuizType.passingScore,
      passed: passed,
      completedAt: new Date().toISOString(),
      questionResults: sessionQuestions.map(sq => ({
        questionId: sq.questionId,
        questionText: sq.Question.questionText,
        userAnswer: sq.userAnswer,
        correctAnswer: ['A', 'B', 'C', 'D'].indexOf(sq.Question.correctAnswer),
        isCorrect: sq.isCorrect,
        explanation: sq.Question.explanation
      }))
    });

  } catch (error) {
    console.error('Error getting session results:', error);
    res.status(500).json({ message: 'Failed to get session results' });
  }
};

// REMOVE AI GENERATION - Database driven only
// Note: You can keep a separate script for updating database with new questions