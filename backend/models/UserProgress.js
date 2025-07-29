// backend/models/UserProgress.js
module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define(
    'UserProgress',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
      quizTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quiz_type_id'
      },
      totalAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_attempts'
      },
      bestScore: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: 'best_score'
      },
      latestScore: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: 'latest_score'
      },
      totalCorrect: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_correct'
      },
      totalQuestions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_questions'
      },
      lastAttemptDate: {
        type: DataTypes.DATE,
        field: 'last_attempt_date'
      }
    },
    {
      tableName: 'user_progress',
      underscored: true,
      timestamps: false
    }
  );

  UserProgress.associate = models => {
    UserProgress.belongsTo(models.User, { foreignKey: 'user_id' });
    UserProgress.belongsTo(models.QuizType, { foreignKey: 'quiz_type_id' });
  };

  return UserProgress;
};