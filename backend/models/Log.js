const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
    // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  },
  entity: {
    type: String
    // equipment, file, issue, comment, user
  },
  entityId: {
    type: String
  },
  detail: {
    type: String
  },
  ip: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);