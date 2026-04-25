const Issue = require('../models/Issue');

exports.getAll = async (req, res) => {
  try {
    const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
    const issues = await Issue.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const issue = await Issue.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.status === 'resolved') req.body.resolvedAt = Date.now();
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};