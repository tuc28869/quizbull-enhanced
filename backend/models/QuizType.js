// backend/models/QuizType.js
module.exports = (sequelize, DataTypes) => {
  const QuizType = sequelize.define(
    'QuizType',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(50), allowNull: false },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'display_name'
      },
      totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'total_questions'
      },
      passingScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'passing_score'
      },
      timeLimit: { type: DataTypes.INTEGER, field: 'time_limit' },
      description: DataTypes.TEXT
    },
    {
      tableName: 'quiz_types',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false                // only created_at in original schema
    }
  );

  QuizType.associate = models => {
    QuizType.hasMany(models.Question, { foreignKey: 'quiz_type_id' });
    QuizType.hasMany(models.QuizSession, { foreignKey: 'quiz_type_id' });
    QuizType.hasMany(models.UserProgress, { foreignKey: 'quiz_type_id' });
  };

  return QuizType;
};