const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: [{
    field:    { type: String },
    oldValue: { type: String },
    newValue: { type: String },
  }],
    type: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    default: 'UPDATE'
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EquipmentHistory', historySchema);