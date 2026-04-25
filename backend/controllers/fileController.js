const File = require('../models/File');

exports.getAll = async (req, res) => {
  try {
    const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
    const files = await File.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const file = await File.create({ ...req.body, uploadedBy: req.user._id });
    res.status(201).json(file);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};