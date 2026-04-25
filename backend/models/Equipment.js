const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ECG', 'EEG', 'Ultrasound', 'MRI', 'CT', 'Xray', 'Lab', 'Other'],
    default: 'Other'
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  serialNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // после поля updatedAt добавь:
  nextMaintenance: {
    type: Date,
    default: null
  }
});

equipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);