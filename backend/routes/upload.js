const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, allow } = require('../middleware/auth');

// POST /api/upload/image
router.post('/image', protect, allow('admin', 'editor'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
    const url = `http://localhost:5000/uploads/images/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/upload/image/:filename
router.delete('/image/:filename', protect, allow('admin', 'editor'), (req, res) => {
  const fs = require('fs');
  const filepath = `uploads/images/${req.params.filename}`;
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;