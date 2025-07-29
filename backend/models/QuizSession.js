// backend/models/QuizSession.js
module.exports = (sequelize, DataTypes) => {
  const QuizSession = sequelize.define(
    'QuizSession',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
      quizTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quiz_type_id'
      },
      sessionType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'session_type',
        validate: { isIn: [['segmented', 'full']] }
      },
      totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'total_questions'
      },
      currentQuestion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'current_question'
      },
      correctAnswers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'correct_answers'
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_completed'
      },
      startTime: { type: DataTypes.DATE, field: 'start_time' },
      endTime: { type: DataTypes.DATE, field: 'end_time' },
      scorePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'score_percentage'
      }
    },
    {
      tableName: 'quiz_sessions',
      underscored: true,
      timestamps: false          // explicit columns already defined
    }
  );

  QuizSession.associate = models => {
    QuizSession.belongsTo(models.User, { foreignKey: 'user_id' });
    QuizSession.belongsTo(models.QuizType, { foreignKey: 'quiz_type_id' });
    QuizSession.hasMany(models.SessionQuestion, { foreignKey: 'session_id' });
  };

  return QuizSession;
};