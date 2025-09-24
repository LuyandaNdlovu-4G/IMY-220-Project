const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["checkin", "checkout"],
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "project",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  version: {
    type: String
  },
  files: [{
    fileName: String,
    filePath: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for performance
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);