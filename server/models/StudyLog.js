const mongoose = require('mongoose');

const studyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // stored as 'YYYY-MM-DD' for easy lookup
    required: true
  },
  totalHours: {
    type: Number,
    default: 0
  },
  taskCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for fast per-user-per-day lookup
studyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudyLog', studyLogSchema);
