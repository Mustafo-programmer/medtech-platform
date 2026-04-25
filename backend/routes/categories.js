const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, allow } = require('../middleware/auth');

// GET /api/categories — все видят
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/categories — только admin
router.post('/', protect, allow('admin'), async (req, res) => {
  try {
    const category = await Category.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Категория уже существует' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/categories/:id — только admin
router.delete('/:id', protect, allow('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Категория не найдена' });
    res.json({ message: 'Категория удалена' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
