const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

 
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],


  type: {
    type: String,
    enum: ["web application", "game", "mobile app", "desktop app", "library", "other"],
    default: "other"
  },

  version: {
    type: String,
    default: "v1.0.0"
  },

  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "collaborator", "viewer"],
      default: "collaborator"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],


  files: [{
    fileName: { type: String, required: true },
    filePath: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    uploadedAt: { type: Date, default: Date.now },
    size: Number, // bytes
    mimeType: String
  }],

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  status: {
    type: String,
    enum: ["checkedIn", "checkedOut"],
    default: "checkedIn"
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    default: null
  }
}, { 
    timestamps: true 
});

module.exports = mongoose.model("project", projectSchema);