const mongoose = require("mongoose");
require("./project.model");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, //trim removes leading and trailing whitespace
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    createdProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "project"
    }]
},
{
    timestamps: true
});

module.exports = mongoose.model("user", userSchema);