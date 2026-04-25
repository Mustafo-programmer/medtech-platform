const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: '🖥'
  },
  color: {
    type: String,
    default: '#4f7cff'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);