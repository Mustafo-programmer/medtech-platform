const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const Issue = require('../models/Issue');
const File = require('../models/File');
const Comment = require('../models/Comment');
const Log = require('../models/Log');
const Settings = require('../models/Settings');
const { protect, allow } = require('../middleware/auth');

// все роуты только для admin
router.use(protect, allow('admin'));

// ── DASHBOARD STATS ──
router.get('/stats', async (req, res) => {
  try {
    const [equipment, users, issues, files, comments] = await Promise.all([
      Equipment.countDocuments(),
      User.countDocuments(),
      Issue.countDocuments(),
      File.countDocuments(),
      Comment.countDocuments()
    ]);

    const openIssues     = await Issue.countDocuments({ status: 'open' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });

    const byCategory = await Equipment.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byStatus = await Equipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      equipment, users, issues, files, comments,
      openIssues, resolvedIssues,
      byCategory, byStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGS ──
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const logs = await Log.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Log.countDocuments();
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/logs', async (req, res) => {
  try {
    await Log.deleteMany();
    res.json({ message: 'Logs cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── SETTINGS ──
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── EXPORT (backup) ──
router.get('/export', async (req, res) => {
  try {
    const [equipment, users, issues, files, comments] = await Promise.all([
      Equipment.find().lean(),
      User.find().select('-password').lean(),
      Issue.find().lean(),
      File.find().lean(),
      Comment.find().lean()
    ]);

    const backup = {
      exportedAt: new Date(),
      version: '1.0',
      data: { equipment, users, issues, files, comments }
    };

    res.setHeader('Content-Disposition', `attachment; filename=medtech-backup-${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ── BLOCK / UNBLOCK USER ──
router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Нельзя заблокировать администратора' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CHANGE PASSWORD (admin меняет любому) ──
router.patch('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Минимум 6 символов' });

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Не найден' });

    user.password = password; // pre-save хук сам захеширует
    await user.save();
    res.json({ message: 'Пароль изменён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ── MAINTENANCE ALERTS ──
router.get('/maintenance', async (req, res) => {
  try {
    const now = new Date();
    const in30days = new Date();
    in30days.setDate(in30days.getDate() + 30);

    const equipment = await Equipment.find({
      nextMaintenance: { $ne: null }
    }).populate('createdBy', 'name').lean();

    const overdue  = equipment.filter(e => new Date(e.nextMaintenance) < now);
    const upcoming = equipment.filter(e => {
      const d = new Date(e.nextMaintenance);
      return d >= now && d <= in30days;
    });

    res.json({ overdue, upcoming });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;