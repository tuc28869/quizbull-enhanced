// backend/models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      passwordHash: {                                   // bcrypt hash
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
      }
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,                // created_at / updated_at
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  User.associate = models => {
    User.hasMany(models.QuizSession, { foreignKey: 'user_id' });
    User.hasMany(models.UserProgress, { foreignKey: 'user_id' });
  };

  return User;
};