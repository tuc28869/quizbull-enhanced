// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, UserProgress, QuizType } = require('../models');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1 – uniqueness check  
    const duplicate = await User.findOne({ where: { email } });
    if (duplicate) return res.status(409).json({ message: 'Email exists' });

    // 2 – hash password  
    const passwordHash = await bcrypt.hash(password, 10);   // 10 salt rounds[5][8]

    // 3 – create user  
    const user = await User.create({ username, email, passwordHash });

    // 4 – create baseline progress rows  (fixed)
    const quizTypes = await QuizType.findAll();   // pull every exam type
    await Promise.all(
      quizTypes.map(type =>
        UserProgress.create({
          userId: user.id,
          quizTypeId: type.id
        })
      )
    );

    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1 – fetch user by email  
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Bad credentials' });

    // 2 – verify password  
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Bad credentials' });

    // 3 – issue JWT  
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );                                                   // JWT standard[1]

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};