// backend/models/Question.js
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define(
    'Question',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      quizTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quiz_type_id'
      },
      questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'question_text'
      },
      optionA: { type: DataTypes.TEXT, allowNull: false, field: 'option_a' },
      optionB: { type: DataTypes.TEXT, allowNull: false, field: 'option_b' },
      optionC: { type: DataTypes.TEXT, allowNull: false, field: 'option_c' },
      optionD: { type: DataTypes.TEXT, allowNull: false, field: 'option_d' },
      correctAnswer: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        field: 'correct_answer'
      },
      explanation: DataTypes.TEXT,
      difficultyLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'difficulty_level'
      },
      topic: DataTypes.STRING(100)
    },
    {
      tableName: 'questions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  Question.associate = models => {
    Question.belongsTo(models.QuizType, { foreignKey: 'quiz_type_id' });
    Question.hasMany(models.SessionQuestion, { foreignKey: 'question_id' });
  };

  return Question;
};