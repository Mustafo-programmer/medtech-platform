const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Обновить lastSeen — вызывается каждые 30 сек с фронта
router.post('/ping', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      lastSeen: Date.now(),
      isOnline: true
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получить онлайн пользователей (активны последние 2 минуты)
router.get('/', protect, async (req, res) => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const users = await User.find({
      lastSeen: { $gte: twoMinutesAgo }
    }).select('name role lastSeen');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;