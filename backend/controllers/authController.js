const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN
});

exports.register = async (req, res) => {
  try {
    const { name, login, password, role, language } = req.body;
    const user = await User.create({ name, login, password, role, language });
    res.status(201).json({
      message: 'User created',
      user: { id: user._id, name: user.name, login: user.login, role: user.role }
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Login already exists' });
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ message: 'Login and password required' });

    const user = await User.findOne({ login }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid login or password' });
    }

    // ← проверка блокировки
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Аккаунт заблокирован. Обратитесь к администратору.' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, language: user.language }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};