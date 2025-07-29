// backend/models/index.js
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');   // your DB config

const sequelize = new Sequelize(config);

const models = {
  User: require('./User')(sequelize, DataTypes),
  QuizType: require('./QuizType')(sequelize, DataTypes),
  Question: require('./Question')(sequelize, DataTypes),
  QuizSession: require('./QuizSession')(sequelize, DataTypes),
  SessionQuestion: require('./SessionQuestion')(sequelize, DataTypes),
  UserProgress: require('./UserProgress')(sequelize, DataTypes)
};

// run each association
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

module.exports = { sequelize, ...models };