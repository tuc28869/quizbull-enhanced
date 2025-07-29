// backend/models/SessionQuestion.js
module.exports = (sequelize, DataTypes) => {
  const SessionQuestion = sequelize.define(
    'SessionQuestion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sessionId: { type: DataTypes.INTEGER, allowNull: false, field: 'session_id' },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'question_id'
      },
      questionOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'question_order'
      },
      userAnswer: { type: DataTypes.CHAR(1), field: 'user_answer' },
      isCorrect: { type: DataTypes.BOOLEAN, field: 'is_correct' },
      answeredAt: { type: DataTypes.DATE, field: 'answered_at' }
    },
    {
      tableName: 'session_questions',
      underscored: true,
      timestamps: false
    }
  );

  SessionQuestion.associate = models => {
    SessionQuestion.belongsTo(models.QuizSession, { foreignKey: 'session_id' });
    SessionQuestion.belongsTo(models.Question, { foreignKey: 'question_id' });
  };

  return SessionQuestion;
};