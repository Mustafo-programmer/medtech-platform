const Comment = require('../models/Comment');

exports.getAll = async (req, res) => {
  try {
    const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
    const comments = await Comment.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const comment = await Comment.create({ ...req.body, author: req.user._id });
    await comment.populate('author', 'name role');
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};