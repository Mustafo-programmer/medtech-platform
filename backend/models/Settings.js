const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'MedTech Platform'
  },
  defaultLanguage: {
    type: String,
    enum: ['ru', 'uz', 'en'],
    default: 'ru'
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowViewerDownload: {
    type: Boolean,
    default: true
  },
  maxUsersAllowed: {
    type: Number,
    default: 50
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);