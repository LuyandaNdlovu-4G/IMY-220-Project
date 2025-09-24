const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();


const app = express();
const port = 3000;
const uri = process.env.MONGO_URI;

app.use(express.json()); //allows you to send json objects as responses  


const User = require("./models/user.model");
const Project = require("./models/project.model");
const Activity = require("./models/activity.model")
const auth = require("./middleware/auth");


//connect to database
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected To MongoDB database 'IMY220_D2'.");
    app.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("Failed to connect to database.");
    console.error(err);
  });


//POST - SIGNUP
app.post("/api/signup", async (req, res) => {
  
  const {username, email, password} = req.body;
  
  if(!username || !email || !password){
    return res.status(400).json({message: "All fields are required."});
  }

  try {
    
    const existingUser = await User.findOne({$or: [{email}, {username}] });
    if(existingUser){
      return res.status(409).json({message: "Username or email already taken." });
    }

    const newUser = new User({
      username,
      email,
      password,
      role: "user"
    })

    await newUser.save();

    res.status(201).json({ message: "User created successfully!" });
  } catch(error) {
    console.log(error);
    res.status(500).json( {message: "Failed to create user. Check fields." });
  }
});


//POST - LOGIN
app.post("/api/login", async (req, res) => {
  const {email, password} = req.body;

  if(!email || !password){
    return res.status(401).json({ message: "Email and password are required." });
  }

  try {

    const user = await User.findOne({ email });
    if(!user) {
      return res.status(401).json({ message: " Invalid credentials." });
    }

    if(password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.json({
      message: "Login Successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error){
    console.log(error);
    res.status(500).json({ message: "Server error. Login Failed."})
  }
});


//POST - CREATE PROJECT
app.post("/api/projects", auth, async (req, res) => {
  const {projectName, description, hashtags, type, version } = req.body;
  if(!projectName || !description) {
    return res.status(400).json({ message: "Project name and description are required" });
  }

  try {
    const newProject = new Project({
      projectName,
      description,
      hashtags: hashtags || [],
      type: type || "other",
      version: version || "v1.0.0",
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: "owner",
        joinedAt: new Date()
      }]
    });

    await newProject.save();

    //add to users 'createdProjects'
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdProjects: newProject._id}
    });

    res.status(201).json({
      message: "Project created successfully!",
      project: {
        id: newProject._id,
        projectName: newProject.projectName,
        owner: req.user.username
      }
    });
  }catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to create project." });
  }
});


// GET - VIEW PROJECTS (NO LOGIN REQUIRED)
app.get("/api/projects/:id/public", async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("owner", "username")
    .select("projectName description type version hashtags createdAt");

  if (!project) return res.status(404).json({ message: "Project not found." });
  res.json(project);
});


//GET - PROJECTS
app.get("/api/projects/mine", auth, async (req, res) => {
  try{
    const projects = await Project.find({
      "members.user": req.user._id
    })
    .populate("owner", "username")
    .populate("members.user", "username")
    .select("projectName description type version createdAt");

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects." });
  }
});


//GET - FRIENDS WITH PROJECTS
app.get("/api/projects/friends", auth, async (req, res) => {
  try{
    const user = await User.findById(req.user._id,).populate("friends", "_id");
    const friendIds = user.friends.map(f => f._id);

    if(friendIds.length === 0){
      return res.json([]);
    }

    //find projects where any member is a friends
    const projects = await Project.find({
      "members.user": {
        $in: friendIds,
        $ne: req.user._id
      }
    })
    .populate("owner", "username")
    .populate("members.user", "username")
    .select("projectName description type version");

    res.json(projects);
  } catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friend projects." })
  }
});


//GET - PROJECT DETAILS
app.get("/api/projects/:id", auth, async (req, res) => {
  try{
    const project = await Project.findById(req.param.id)
      .populate("owner", "username email")
      .populate("members.user", "username email")
      .populate("files.uploadedBy", "username");

    if(!project){
      return res.status(404).json({ message: "Project not found." });
    }

    //check if user is member
    const isMember = project.members.some(m =>
      m.user._id.toString() === req.user._id.toString()
    );

    if(!isMember) {
      return res.status(403).json({ message: "You are not a member of this project." });
    }

    res.json(project);
  } catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to fetch project." });
  }
});


//POST - UPLOAD FILE (Metadata)
app.post("/api/projects/:id/files", auth, async (req, res) => {
  const { fileName, filePath, size, mimeType } = req.body;

  if (!fileName || !filePath) {
    return res.status(400).json({ message: "File name and path are required." });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if user is a member
    const isMember = project.members.some(m => 
      m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You must be a member to upload files." });
    }

    const newFile = {
      fileName,
      filePath,
      uploadedBy: req.user._id,
      size,
      mimeType
    };

    project.files.push(newFile);
    await project.save();

    res.status(201).json({ message: "File added successfully!", file: newFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add file." });
  }
});


//ADD FRIEND
app.post("/api/friends", auth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const friend = await User.findOne({ email });
    if (!friend) {
      return res.status(404).json({ message: "User not found." });
    }

    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as a friend." });
    }

    const isAlreadyFriend = req.user.friends.some(f => 
      f.toString() === friend._id.toString()
    );

    if (isAlreadyFriend) {
      return res.status(409).json({ message: "Already friends." });
    }

    // Add to both users
    await User.findByIdAndUpdate(req.user._id, {
      $push: { friends: friend._id }
    });

    res.json({ message: `Friend ${friend.username} added successfully!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add friend." });
  }
});


//GET FRIENDS LIST
app.get("/api/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "username email createdAt");

    res.json(user.friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friends." });
  }
});


//GET FRIEND'S PROJECTS
app.get("/api/friends/:id/projects", auth, async (req, res) => {
  try {
    const friendId = req.params.id;

    // Verify friend exists and is in user's friend list
    const user = await User.findById(req.user._id);
    const isFriend = user.friends.some(f => f.toString() === friendId);

    if (!isFriend) {
      return res.status(403).json({ message: "Not your friend." });
    }

    const projects = await Project.find({
      "members.user": friendId
    })
    .populate("owner", "username")
    .populate("members.user", "username")
    .select("projectName description type version");

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch friend's projects." });
  }
});


//DELETE (UN-FRIEND)
app.delete("/api/friends/:friendId", auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { friends: req.params.friendId }
  });
  res.json({ message: "Unfriended successfully." });
});


//PUT - UPDATE PROJECT (owner only)
app.put("/api/projects/:id", auth, async (req, res) => {
  const { projectName, description, hashtags, type, version } = req.body;
  const projectId = req.params.id;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if user is the owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can edit this project." });
    }

    // Update fields (only if provided)
    if (projectName !== undefined) project.projectName = projectName;
    if (description !== undefined) project.description = description;
    if (hashtags !== undefined) project.hashtags = hashtags;
    if (type !== undefined) project.type = type;
    if (version !== undefined) project.version = version;

    await project.save();

    res.json({
      message: "Project updated successfully!",
      project: {
        id: project._id,
        projectName: project.projectName,
        description: project.description,
        hashtags: project.hashtags,
        type: project.type,
        version: project.version,
        updatedAt: project.updatedAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update project." });
  }
});

//DELETE PROJECT (owner only)
app.delete("/api/projects/:id", auth, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found." });
  
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only owner can delete." });
  }

  await Project.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(project.owner, {
    $pull: { createdProjects: req.params.id }
  });

  res.json({ message: "Project deleted." });
});


//GET - (SEARCH)
app.get("/api/search", async (req, res) => {
  const { q, type } = req.query;
  if (type === "user") {
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).select("username email");
    return res.json(users);
  } else {
    const projects = await Project.find({
      $or: [
        { projectName: { $regex: q, $options: "i" } },
        { hashtags: { $in: [q.toLowerCase()] } }
      ]
    }).select("projectName description type hashtags");
    return res.json(projects);
  }
});


//POST - CHECK OUT PROJECT
app.post("/api/projects/:id/checkout", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });

  
    const isMember = project.members.some(m => 
      m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You must be a project member to check out." });
    }

    if (project.status !== "checkedIn") {
      return res.status(400).json({ 
        message: "Project is already checked out.",
        checkedOutBy: project.checkedOutBy
      });
    }

    // Lock the project
    project.status = "checkedOut";
    project.checkedOutBy = req.user._id;
    await project.save();

    // Log activity
    const activity = new Activity({
      type: "checkout",
      project: project._id,
      user: req.user._id
    });
    await activity.save();

    res.json({
      message: "Project checked out successfully.",
      project: {
        id: project._id,
        status: project.status,
        checkedOutBy: req.user.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check out project." });
  }
});


//POST - CHECK IN PROJECT
app.post("/api/projects/:id/checkin", auth, async (req, res) => {
  const { message, version, newFiles = [] } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (project.checkedOutBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "Only the user who checked out the project can check it in." 
      });
    }

    // Update project files (append new ones)
    const fileMetadata = newFiles.map(f => ({
      fileName: f.fileName,
      filePath: f.filePath,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      size: f.size,
      mimeType: f.mimeType
    }));
    project.files.push(...fileMetadata);

    if (version){
      project.version = version;
    }

    project.status = "checkedIn";
    project.checkedOutBy = null;
    await project.save();

    const activity = new Activity({
      type: "checkin",
      project: project._id,
      user: req.user._id,
      message: message || "No message provided.",
      version: project.version,
      files: fileMetadata.map(f => ({ fileName: f.fileName, filePath: f.filePath }))
    });
    await activity.save();

    res.json({
      message: "Project checked in successfully.",
      activity: {
        id: activity._id,
        message: activity.message,
        version: activity.version,
        filesAdded: activity.files.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check in project." });
  }
});

//GET - GLOBAL ACTIVITY FEED
app.get("/api/activity", async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "username")
      .populate("project", "projectName type");

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch global activity." });
  }
});


//GET - LOCAL ACTIVITY FEED (FRIENDS + SELF)
app.get("/api/activity/local", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "_id");
    const userIds = [req.user._id, ...user.friends.map(f => f._id)];

    const activities = await Activity.find({
      user: { $in: userIds }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "username")
    .populate("project", "projectName type");

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch local activity." });
  }
});



// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
