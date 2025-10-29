const express = require("express");
const path = require("path");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const { connectDB, getCollection} = require("./db/conn");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Admin middleware to check if user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const users = req.app.locals.users;
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, "../frontend/public")));
const port = 3001;


//handle image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: path.join(__dirname, "uploads/") });

// Connect to database
connectDB().then(() => {
    app.locals.users = getCollection("users");
    app.locals.projects = getCollection("projects");
    app.locals.activities = getCollection("activities");

    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
});

// POST - SIGNUP
app.post("/api/signup", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const users = req.app.locals.users;

    if (!users) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const existingUser = await users.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({ message: "Username or email already taken." });
        }

        const result = await users.insertOne({
            username: username.trim(),
            email: email.trim(),
            password: password,
            role: "user",
            createdAt: new Date(),
            friends: [],
            createdProjects: [],
            banned: false,
            details: {
              bio: "",
              avatar: "",
              location: "",
              skills: []
            }
        });

        res.status(201).json({
            message: "User created successfully!",
            user: {
                id: result.insertedId.toString(),
                username: username.trim(),
                email: email.trim()
            }
        });
    } catch (err) {
        console.error("Signup error:", err.stack);
        res.status(500).json({ message: "Server error while signing up." });
    }
});


// POST - LOGIN
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(401).json({ message: "Email and password are required." });
    }

    try {
        const users = req.app.locals.users;

        if (!users) {
            return res.status(500).json({ message: "Database not initialized." });
        }

        const existingUser = await users.findOne({ email: email.trim() });
        if (!existingUser) {
            return res.status(401).json({ message: "Invalid email." });
        }

        if (existingUser.password !== password) {
            return res.status(401).json({ message: "Invalid password." });
        }



        res.json({
            message: "Login successful!",
            user: {
                id: existingUser._id.toString(),
                username: existingUser.username,
                email: existingUser.email,
                role: existingUser.role || "user"
            }
        });
    } catch (error) {
        console.error("Login error:", error.stack);
        res.status(500).json({ message: "Server error during login." });
    }
});


// GET logged-in user
app.get("/api/users/me", (req, res) => {

    res.json({
        id: req.user._id.toString(),
        username: req.user.username,
        email: req.user.email
    });
});


// POST - LOGOUT
app.post("/api/logout", (req, res) => {
  // No session logic, just respond with success
  res.json({ message: "Logged out successfully." });
});


// POST - CREATE PROJECT
app.post("/api/projects", async (req, res) => {
  const { projectName, description, hashtags, type, version, userId, username } = req.body;

  if (!projectName || !description || !userId || !username) {
    return res.status(400).json({ message: "Project name, description, userId, and username are required." });
  }

  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const activities = req.app.locals.activities;

    if (!projects || !users) {
      return res.status(500).json({ message: "Database not initialized." });
    }

    const allowedTypes = ["web application", "game", "mobile app", "desktop app", "library", "other"];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid project type." });
    }

    const ownerObjectId = new ObjectId(userId);
    const newProject = {
      projectName: projectName.trim(),
      description: description.trim(),
      hashtags: Array.isArray(hashtags) ? hashtags.map(tag => tag.toLowerCase().trim()) : [],
      type: type || "other",
      version: version || "v1.0.0",
      owner: ownerObjectId,
      members: [{
        user: ownerObjectId,
        role: "owner",
        joinedAt: new Date()
      }],
      files: [],
      status: "checkedIn",
      checkedOutBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await projects.insertOne(newProject);

    await users.updateOne(
      { _id: ownerObjectId },
      { $push: { createdProjects: result.insertedId } }
    );

    await activities.insertOne({
      user: ownerObjectId,
      project: result.insertedId,
      type: "project_created",
      message: `${username} created project "${projectName}"`,
      version: version || "v1.0.0",
      createdAt: new Date()
    });

    res.status(201).json({
      message: "Project created successfully!",
      project: {
        id: result.insertedId.toString(),
        projectName: newProject.projectName,
        owner: username
      }
    });
  } catch (err) {
    console.error("Create project error:", err.stack);
    console.log(userId, username);
    res.status(500).json({ message: "Failed to create project." });
  }
});


// GET - VIEW PROJECTS (NO LOGIN REQUIRED)
app.get("/api/projects/:id/public", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;

    if (!projects || !users) {
      return res.status(500).json({ message: "Database not initialized." });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await projects.findOne(
      { _id: new ObjectId(req.params.id) },
      {
        projection: {
          projectName: 1,
          description: 1,
          type: 1,
          version: 1,
          hashtags: 1,
          createdAt: 1,
          owner: 1
        }
      }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const owner = await users.findOne(
      { _id: project.owner },
      { projection: { username: 1 } }
    );

    res.json({
      ...project,
      owner: owner ? { username: owner.username } : null
    });
  } catch (err) {
    console.error("Error fetching public project:", err);
    res.status(500).json({ message: "Server error." });
  }
});


//GET - PROJECTS (Current user only)
app.get("/api/projects/mine", async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('Fetching projects for userId:', userId);
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ message: "User ID is required." });
    }
    // Validate ObjectId
    const isValid = ObjectId.isValid(userId);
    console.log('Is userId valid ObjectId?', isValid);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid userId format." });
    }

    const projects = req.app.locals.projects;
    const users = req.app.locals.users;

    const results = await projects
      .find({ "members.user": new ObjectId(userId) })
      .toArray();

    const populatedProjects = await Promise.all(
      results.map(async (proj) => {
        const owner = await users.findOne(
          { _id: proj.owner },
          { projection: { username: 1 } }
        );

        const members = await Promise.all(
          proj.members.map(async (member) => {
            const memberUser = await users.findOne(
              { _id: member.user },
              { projection: { username: 1 } }
            );
            return {
              ...member,
              user: memberUser ? { username: memberUser.username } : null
            };
          })
        );

        return {
          ...proj,
          owner: owner ? { username: owner.username } : null,
          members
        };
      })
    );

    res.json(populatedProjects);
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).json({ message: "Failed to fetch projects." });
  }
});


//GET - FRIENDS WITH PROJECTS
app.get("/api/projects/friends", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;

    const user = await users.findOne(
      { _id: ObjectId(req.user._id) },
      { projection: { friends: 1 } }
    );

    if (!user || !user.friends || user.friends.length === 0) {
      return res.json([]);
    }

    const friendIds = user.friends.map((id) => ObjectId(id));

    const results = await projects
      .find({
        "members.user": { $in: friendIds, $ne: ObjectId(req.user._id) }
      })
      .toArray();

    const populatedProjects = await Promise.all(
      results.map(async (proj) => {
        const owner = await users.findOne(
          { _id: proj.owner },
          { projection: { username: 1 } }
        );

        const members = await Promise.all(
          proj.members.map(async (member) => {
            const memberUser = await users.findOne(
              { _id: member.user },
              { projection: { username: 1 } }
            );
            return {
              ...member,
              user: memberUser ? { username: memberUser.username } : null
            };
          })
        );

        return {
          ...proj,
          owner: owner ? { username: owner.username } : null,
          members
        };
      })
    );

    res.json(populatedProjects);
  } catch (err) {
    console.error("Error fetching friends' projects:", err);
    res.status(500).json({ message: "Failed to fetch friend projects." });
  }
});


//GET - Specific PROJECT DETAILS (must be a member)
app.get("/api/projects/:id", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const userId = req.headers['user-id']; 

    if (!projects || !users) {
      return res.status(500).json({ message: "Database not initialized." });
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    const project = await projects.findOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }



    // Check if user is a member or a friend of the owner
    const owner = await users.findOne({ _id: project.owner });
    const isMember = project.members.some(
      (m) => m.user.toString() === userId
    );
    const isFriendOfOwner = owner.friends.some(friendId => friendId.toString() === userId);

    if (!isMember && !isFriendOfOwner) {
      return res.status(403).json({ message: "You are not authorized to view this project." });
    }

    // Populate owner
    const ownerDetails = await users.findOne(
      { _id: project.owner },
      { projection: { username: 1, email: 1 } }
    );

    // Populate members
    const members = await Promise.all(
      project.members.map(async (m) => {
        const memberUser = await users.findOne(
          { _id: m.user },
          { projection: { username: 1, email: 1, details: 1 } }
        );
        return {
          ...m,
          user: memberUser ? { 
            _id: m.user, 
            username: memberUser.username, 
            email: memberUser.email,
            details: memberUser.details 
          } : null
        };
      })
    );

    // Populate files.uploadedBy and files.checkedOutBy
    const files = await Promise.all(
      (project.files || []).map(async (file) => {
        const uploadedByUser = await users.findOne(
          { _id: file.uploadedBy },
          { projection: { username: 1 } }
        );
        const checkedOutByUser = file.checkedOutBy ? await users.findOne(
          { _id: file.checkedOutBy },
          { projection: { username: 1 } }
        ) : null;
        return {
          ...file,
          uploadedBy: uploadedByUser ? { _id: file.uploadedBy, username: uploadedByUser.username } : null,
          checkedOutBy: checkedOutByUser ? { _id: file.checkedOutBy, username: checkedOutByUser.username } : null
        };
      })
    );

    res.json({
      ...project,
      owner: ownerDetails ? { _id: project.owner, username: ownerDetails.username, email: ownerDetails.email } : null,
      members,
      files
    });
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({ message: "Failed to fetch project." });
  }
});


// //ADD FRIEND
app.post("/api/friends", async (req, res) => {
  const { email } = req.body;
  const userId = req.headers['user-id'];

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  if (!userId || !ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid user ID is required in headers." });
  }

  try {
    const users = req.app.locals.users;
    const currentUser = await users.findOne({ _id: new ObjectId(userId) });
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const friend = await users.findOne({ email });
    if (!friend) {
      return res.status(404).json({ message: "User with that email not found." });
    }

    if (friend._id.toString() === userId) {
      return res.status(400).json({ message: "You cannot add yourself as a friend." });
    }

    const isAlreadyFriend = currentUser.friends.some(f => f.toString() === friend._id.toString());
    if (isAlreadyFriend) {
      return res.status(409).json({ message: "Already friends." });
    }

    // Use $addToSet to create a mutual friendship and prevent duplicates
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { friends: friend._id } }
    );
    await users.updateOne(
      { _id: friend._id },
      { $addToSet: { friends: new ObjectId(userId) } }
    );

    res.json({ message: `Friend ${friend.username} added successfully!` });
  } catch (err) {
    console.error("Error adding friend:", err);
    res.status(500).json({ message: "Failed to add friend." });
  }
});


// //GET FRIENDS LIST
app.get("/api/friends", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const userId = req.headers['user-id'];

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { friends: 1 } }
    );

    if (!user) {
      return res.json([]);
    }

    const friendIds = user.friends ? user.friends.map(id => new ObjectId(id)) : [];
    if (friendIds.length === 0) {
      return res.json([]);
    }

    const friends = await users
      .find({ _id: { $in: friendIds } })
      .project({ username: 1, email: 1, createdAt: 1 })
      .toArray();

    res.json(friends);
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ message: "Failed to fetch friends." });
  }
});


// //GET FRIEND'S PROJECTS
app.get("/api/friends/:id/projects", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;
    const userId = req.headers['user-id'];

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid friend ID." });
    }

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.friends.some(friendId => friendId.toString() === req.params.id)) {
      return res.status(403).json({ message: "Not your friend." });
    }

    const results = await projects
      .find({ "members.user": new ObjectId(req.params.id) })
      .toArray();

    const populatedProjects = await Promise.all(
      results.map(async (proj) => {
        const owner = await users.findOne(
          { _id: proj.owner },
          { projection: { username: 1 } }
        );

        const members = await Promise.all(
          proj.members.map(async (member) => {
            const memberUser = await users.findOne(
              { _id: member.user },
              { projection: { username: 1 } }
            );
            return {
              ...member,
              user: memberUser ? { username: memberUser.username } : null
            };
          })
        );

        return {
          ...proj,
          owner: owner ? { username: owner.username } : null,
          members
        };
      })
    );

    res.json(populatedProjects);
  } catch (err) {
    console.error("Error fetching friend's projects:", err);
    res.status(500).json({ message: "Failed to fetch friend's projects." });
  }
});

// DELETE PROJECT (owner only)
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const userId = req.headers['user-id'];

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    const project = await projects.findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only owner can delete." });
    }

    await projects.deleteOne({ _id: new ObjectId(req.params.id) });
    await users.updateOne(
      { _id: new ObjectId(project.owner) },
      { $pull: { createdProjects: new ObjectId(req.params.id) } }
    );

    res.json({ message: "Project deleted." });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ message: "Failed to delete project." });
  }
});


// DELETE (UN-FRIEND)
app.delete("/api/friends/:friendId", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const userId = req.headers['user-id'];

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { friends: new ObjectId(req.params.friendId) } }
    );

    res.json({ message: "Unfriended successfully." });
  } catch (err) {
    console.error("Unfriend error:", err);
    res.status(500).json({ message: "Failed to unfriend." });
  }
});

// ... existing code ...
// This route is deprecated in favor of file-level checkouts.
// app.post("/api/projects/:id/checkout", ...

// This route is deprecated in favor of file-level checkins.
// app.post("/api/projects/:id/checkin", ...
// ... existing code ...

// POST - check out file
app.post("/api/files/:fileId/checkout", async (req, res) => {
  const projects = req.app.locals.projects;
  const users = req.app.locals.users;
  const fileId = req.params.fileId;
  const userId = req.headers['user-id'];

  if (!ObjectId.isValid(fileId)) return res.status(400).json({ message: "Invalid file ID." });
  if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });

  const project = await projects.findOne({ "files._id": new ObjectId(fileId) });
  if (!project) return res.status(404).json({ message: "File not found in any project." });

  const fileToCheckout = project.files.find(f => f._id.toString() === fileId);
  if (fileToCheckout.status === "checkedOut") {
    return res.status(409).json({ message: "File is already checked out." });
  }

  await projects.updateOne(
    { "files._id": new ObjectId(fileId) },
    { $set: { "files.$.status": "checkedOut", "files.$.checkedOutBy": new ObjectId(userId) } }
  );

  // Prepare metadata header
  const user = await users.findOne({ _id: new ObjectId(userId) });
  const metadataHeader = `
==================================================
File Metadata
--------------------------------------------------
Project: ${project.projectName}
File: ${fileToCheckout.fileName}
Version: ${project.version}
Checked Out By: ${user ? user.username : 'Unknown'}
Checked Out At: ${new Date().toUTCString()}
==================================================

`;

  // Read file, prepend header, and send
  const filePath = path.resolve(fileToCheckout.filePath);
  fs.readFile(filePath, (err, fileContent) => {
    if (err) {
      console.error("File read error:", err);
      return res.status(500).json({ message: "Error reading file." });
    }

    const contentWithHeader = Buffer.concat([Buffer.from(metadataHeader), fileContent]);

    res.setHeader('Content-Disposition', `attachment; filename="${fileToCheckout.fileName}"`);
    res.setHeader('Content-Type', fileToCheckout.mimeType);
    res.setHeader('Content-Length', contentWithHeader.length);
    res.send(contentWithHeader);
  });
});

// GET - ALL USERS
app.get("/api/users", async (req, res) => {
  try {
    const users = req.app.locals.users;

    const allUsers = await users.find().project({ password: 0 }).toArray();

    res.json(allUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// POST - check in file
app.post("/api/files/:fileId/checkin", upload.single("file"), async (req, res) => {
  const projects = req.app.locals.projects;
  const activities = req.app.locals.activities;
  const fileId = req.params.fileId;
  const userId = req.headers['user-id'];
  const { message, version } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "A file upload is required to check in." });
  }

  if (!ObjectId.isValid(fileId)) return res.status(400).json({ message: "Invalid file ID." });
  if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });

  const project = await projects.findOne({ "files._id": new ObjectId(fileId) });
  if (!project) return res.status(404).json({ message: "File not found in any project." });

  // Check if user is owner or member
  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some(member => member.user.toString() === userId);
  
  if (!isOwner && !isMember) {
    return res.status(403).json({ message: "Access denied. You must be a project member to check in files." });
  }

  const fileToCheckIn = project.files.find(f => f._id.toString() === fileId);
  if (!fileToCheckIn) {
    return res.status(404).json({ message: "File not found." });
  }

  // Update file metadata and status
  let fileUpdateFields = {
    "files.$.status": "checkedIn",
    "files.$.checkedOutBy": null,
    "files.$.uploadedAt": new Date()
  };

  // If a new file is uploaded, update file info
  if (req.file) {
    fileUpdateFields["files.$.filePath"] = req.file.path;
    fileUpdateFields["files.$.fileName"] = req.file.originalname;
    fileUpdateFields["files.$.size"] = req.file.size;
    fileUpdateFields["files.$.mimeType"] = req.file.mimetype;
  }

  await projects.updateOne(
    { "files._id": new ObjectId(fileId) },
    { $set: fileUpdateFields }
  );

  // Also update project version if provided
  if (version) {
    await projects.updateOne(
      { _id: project._id },
      { $set: { version: version, updatedAt: new Date() } }
    );
  }

  // Log activity
  await activities.insertOne({
    type: "checkin_file",
    project: project._id,
    user: new ObjectId(userId),
    message: message || `Checked in file: ${fileToCheckIn.fileName}`,
    version: version || project.version,
    createdAt: new Date()
  });

  res.json({ message: "File checked in successfully." });
});

// GET - GLOBAL ACTIVITY FEED
app.get("/api/activity", async (req, res) => {
  try {
    const activities = req.app.locals.activities;
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;

    const results = await activities.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          type: 1,
          createdAt: 1,
          "user.username": 1,
          "project.projectName": 1,
          "project.type": 1
        }
      }
    ]).toArray();

    res.json(results);
  } catch (err) {
    console.error("Global activity error:", err);
    res.status(500).json({ message: "Failed to fetch global activity." });
  }
});


// GET - LOCAL ACTIVITY FEED (FRIENDS + SELF)
app.get("/api/activity/local", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const activities = req.app.locals.activities;
    const userId = req.headers['user-id'];

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const friendIds = user.friends ? user.friends.map(f => new ObjectId(f)) : [];
    const userIds = [new ObjectId(userId), ...friendIds];

    const results = await activities.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          type: 1,
          message: 1,
          version: 1,
          createdAt: 1,
          "user.username": 1,
          "user._id": 1,
          "project.projectName": 1,
          "project.type": 1
        }
      }
    ]).toArray();

    res.json(results);
  } catch (err) {
    console.error("Local activity error:", err);
    res.status(500).json({ message: "Failed to fetch local activity." });
  }
});

// GET - activites related to specific projects
app.get("/api/projects/:id/activity", async (req, res) => {
  try {
    const activities = req.app.locals.activities;
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;

    if (!activities || !users || !projects) {
      return res.status(500).json({ message: "Database not initialized." });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    // Find activities for this project
    const results = await activities.aggregate([
      { $match: { project: new ObjectId(req.params.id) } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          type: 1,
          message: 1,
          version: 1,
          createdAt: 1,
          "user.username": 1,
          "project.projectName": 1,
          "project.type": 1
        }
      }
    ]).toArray();

    res.json({ activities: results });
  } catch (err) {
    console.error("Project activity error:", err);
    res.status(500).json({ message: "Failed to fetch project activity." });
  }
});


//PUT - update project details and upload files (owner only)
app.put("/api/projects/:id", upload.array("files"), async (req, res) => {
  const { projectName, description, hashtags, type, version } = req.body;
  const projectId = req.params.id;
  const userId = req.headers['user-id'];

  try {
    const projects = req.app.locals.projects;

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if user is owner or a member for different permissions
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(member => member.user.toString() === userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Only project members can edit this project." });
    }

    // Only owners can edit project metadata (name, description, etc.)
    // Members can only upload files through this endpoint
    const updateFields = {};
    
    if (isOwner) {
      // Owners can edit all project properties
      if (projectName !== undefined) updateFields.projectName = projectName.trim();
      if (description !== undefined) updateFields.description = description.trim();
      if (hashtags !== undefined) {
          const parsedHashtags = typeof hashtags === 'string' ? hashtags.split(',').map(tag => tag.trim().toLowerCase()) : [];
          updateFields.hashtags = parsedHashtags;
      }
      if (type !== undefined) updateFields.type = type;
      if (version !== undefined) updateFields.version = version;
      updateFields.updatedAt = new Date();
    } else {
      // Members can only upload files, not edit project metadata
      if (projectName !== undefined || description !== undefined || hashtags !== undefined || type !== undefined || version !== undefined) {
        return res.status(403).json({ message: "Only project owners can edit project details." });
      }
    }

    // Handle file uploads
    let newFiles = [];
    if (req.files && req.files.length > 0) {
      newFiles = req.files.map(file => ({
        _id: new ObjectId(),
        fileName: file.originalname,
        filePath: path.join(__dirname, 'uploads', file.filename), // Store absolute path
        uploadedBy: new ObjectId(userId),
        uploadedAt: new Date(),
        size: file.size,
        mimeType: file.mimetype,
        status: "checkedIn",
        checkedOutBy: null
      }));
      updateFields.$push = { files: { $each: newFiles } };
    }

    // Handle file removals
    if (req.body.keepFiles) {
        const keepFiles = JSON.parse(req.body.keepFiles);
        await projects.updateOne(
            { _id: new ObjectId(projectId) },
            { $pull: { files: { _id: { $nin: keepFiles.map(id => new ObjectId(id)) } } } }
        );
    }
    
    // Perform updates
    const updateOperation = {};
    const { $push, ...setFields } = updateFields;

    if (Object.keys(setFields).length > 0) {
        updateOperation.$set = setFields;
    }
    if ($push) {
        updateOperation.$push = $push;
    }

    if (Object.keys(updateOperation).length > 0) {
        await projects.updateOne(
            { _id: new ObjectId(projectId) },
            updateOperation
        );
    }

    const updatedProject = await projects.findOne({ _id: new ObjectId(projectId) });

    // Populate files before sending back
    const populatedFiles = await Promise.all(
        (updatedProject.files || []).map(async (file) => {
            const uploadedByUser = await req.app.locals.users.findOne(
                { _id: file.uploadedBy },
                { projection: { username: 1 } }
            );
            return {
                ...file,
                uploadedBy: uploadedByUser ? { _id: file.uploadedBy, username: uploadedByUser.username } : null
            };
        })
    );

    res.json({
      message: "Project updated successfully!",
      project: { ...updatedProject, files: populatedFiles }
    });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ message: "Failed to update project." });
  }
});

//GET - download file
app.get("/api/files/:fileId", async (req, res) => {
  const projects = req.app.locals.projects;
  const fileId = req.params.fileId;
  const project = await projects.findOne({ "files._id": new ObjectId(fileId) });
  if (!project) return res.status(404).send("File not found");
  const file = project.files.find(f => f._id.toString() === fileId);
  if (!file) return res.status(404).send("File not found");
  res.download(file.filePath, file.fileName);
});

// GET A SPECIFIC USER'S PROFILE
app.get("/api/users/:userId/profile", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }


    console.log(user);
    // Construct full avatar URL if it exists
    if (user.details && user.details.avatar) {
      user.details.avatar = `http://localhost:3001${user.details.avatar}`;
    }

    // Fetch user's projects
    const userProjects = await projects.find({ owner: new ObjectId(userId) }).toArray();

    // Fetch user's friends' details
    const friendIds = user.friends ? user.friends.map(id => new ObjectId(id)) : [];
    const userFriends = await users.find({ _id: { $in: friendIds } }).project({ username: 1, email: 1 }).toArray();

    res.json({
      profile: user,
      projects: userProjects,
      friends: userFriends
    });

  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Failed to fetch user profile." });
  }
});

// GET - PROFILE
app.get("/api/profile", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const userId = req.headers['user-id'];
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { username: 1, email: 1, details: 1 } }
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    // Construct full avatar URL if it exists
    if (user.details && user.details.avatar) {
      user.details.avatar = `http://localhost:3001${user.details.avatar}`;
    }

    res.json(user);
  } catch (err) {
    console.error("Profile details error:", err);
    res.status(500).json({ message: "Failed to fetch profile details." });
  }
});


app.put("/api/profile/details", upload.single('avatar'), async (req, res) => {
  try {
    const users = req.app.locals.users;
    const userId = req.headers['user-id'];
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid user ID is required in headers." });
    }
    const { bio, location, skills } = req.body;
    const updateFields = {};
    if (bio !== undefined) updateFields["details.bio"] = bio;
    if (location !== undefined) updateFields["details.location"] = location;
    if (skills !== undefined) updateFields["details.skills"] = skills;

    // Handle avatar upload
    if (req.file) {
      updateFields["details.avatar"] = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updateFields).length > 0) {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateFields }
      );
    }
    
    res.json({ message: "Profile details updated." });
  } catch (err) {
    console.error("Update profile details error:", err);
    res.status(500).json({ message: "Failed to update profile details." });
  }
});

// POST - UPLOAD FILE TO PROJECT
app.post("/api/projects/:id/files", upload.array("files"), async (req, res) => {
  const projects = req.app.locals.projects;
  const activities = req.app.locals.activities;
  const projectId = req.params.id;
  const userId = req.headers['user-id'];

  if (!ObjectId.isValid(projectId)) return res.status(400).json({ message: "Invalid project ID." });
  if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });

  const project = await projects.findOne({ _id: new ObjectId(projectId) });
  if (!project) return res.status(404).json({ message: "Project not found." });

  // Check if user is owner or a member of the project
  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some(member => member.user.toString() === userId);
  
  if (!isOwner && !isMember) {
    return res.status(403).json({ message: "Only project members can add files." });
  }

  const newFiles = req.files.map(file => ({
    _id: new ObjectId(),
    fileName: file.originalname,
    filePath: path.join(__dirname, 'uploads', file.filename), // Store absolute path
    size: file.size,
    mimeType: file.mimetype,
    status: "checkedIn",
    checkedOutBy: null,
    uploadedAt: new Date()
  }));

  await projects.updateOne(
    { _id: new ObjectId(projectId) },
    { $push: { files: { $each: newFiles } } }
  );

  // Log activity
  await activities.insertMany(
    newFiles.map(file => ({
      type: "file_uploaded",
      project: projectId,
      user: new ObjectId(userId),
      message: `Uploaded file: ${file.fileName}`,
      version: project.version,
      createdAt: new Date()
    }))
  );

  res.status(201).json({ message: "Files uploaded successfully." });
});

// POST - ADD MEMBER TO PROJECT (owner only)
app.post("/api/projects/:id/members", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const activities = req.app.locals.activities;
    const projectId = req.params.id;
    const userId = req.headers['user-id'];
    const { email, role } = req.body;

    if (!ObjectId.isValid(projectId)) return res.status(400).json({ message: "Invalid project ID." });
    if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });
    if (!email) return res.status(400).json({ message: "Email is required." });

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    // Check if current user is the project owner
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only project owner can add members." });
    }

    // Find user by email
    const userToAdd = await users.findOne({ email: email.trim() });
    if (!userToAdd) return res.status(404).json({ message: "User with this email not found." });

    // Check if user is already a member
    const isAlreadyMember = project.members.some(member => member.user.toString() === userToAdd._id.toString());
    if (isAlreadyMember) return res.status(409).json({ message: "User is already a member of this project." });

    const newMember = {
      user: userToAdd._id,
      role: role || 'member',
      joinedAt: new Date()
    };

    // Add member to project
    await projects.updateOne(
      { _id: new ObjectId(projectId) },
      { $push: { members: newMember } }
    );

    // Log activity
    await activities.insertOne({
      type: "member_added",
      project: new ObjectId(projectId),
      user: new ObjectId(userId),
      message: `${userToAdd.username} was added to the project`,
      version: project.version,
      createdAt: new Date()
    });

    // Return the new member with user details populated
    const memberWithDetails = {
      ...newMember,
      user: {
        _id: userToAdd._id,
        username: userToAdd.username,
        email: userToAdd.email,
        details: userToAdd.details
      }
    };

    res.status(201).json({ 
      message: "Member added successfully.",
      member: memberWithDetails
    });

  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Failed to add member." });
  }
});

// DELETE - REMOVE MEMBER FROM PROJECT (owner only)
app.delete("/api/projects/:id/members/:memberId", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const activities = req.app.locals.activities;
    const projectId = req.params.id;
    const memberIdToRemove = req.params.memberId;
    const userId = req.headers['user-id'];

    if (!ObjectId.isValid(projectId)) return res.status(400).json({ message: "Invalid project ID." });
    if (!ObjectId.isValid(memberIdToRemove)) return res.status(400).json({ message: "Invalid member ID." });
    if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    // Check if current user is the project owner
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only project owner can remove members." });
    }

    // Don't allow owner to remove themselves
    if (memberIdToRemove === userId) {
      return res.status(400).json({ message: "Project owner cannot remove themselves." });
    }

    // Check if the user is actually a member of the project
    const memberExists = project.members.some(member => member.user.toString() === memberIdToRemove);
    if (!memberExists) {
      return res.status(404).json({ message: "User is not a member of this project." });
    }

    // Get member details for activity log
    const memberToRemove = await users.findOne(
      { _id: new ObjectId(memberIdToRemove) },
      { projection: { username: 1 } }
    );

    // Remove member from project
    await projects.updateOne(
      { _id: new ObjectId(projectId) },
      { $pull: { members: { user: new ObjectId(memberIdToRemove) } } }
    );

    // Log activity
    await activities.insertOne({
      type: "member_removed",
      project: new ObjectId(projectId),
      user: new ObjectId(userId),
      message: `${memberToRemove?.username || 'A member'} was removed from the project`,
      version: project.version,
      createdAt: new Date()
    });

    res.json({ 
      message: "Member removed successfully.",
      removedMemberId: memberIdToRemove
    });

  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ message: "Failed to remove member." });
  }
});

// DELETE - REMOVE FILE FROM PROJECT (members can delete files)
app.delete("/api/projects/:projectId/files/:fileId", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;
    const projectId = req.params.projectId;
    const fileId = req.params.fileId;
    const userId = req.headers['user-id'];

    if (!ObjectId.isValid(projectId)) return res.status(400).json({ message: "Invalid project ID." });
    if (!ObjectId.isValid(fileId)) return res.status(400).json({ message: "Invalid file ID." });
    if (!userId || !ObjectId.isValid(userId)) return res.status(401).json({ message: "Unauthorized." });

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    // Check if user is owner or a member of the project
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(member => member.user.toString() === userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Only project members can delete files." });
    }

    // Check if file exists in the project
    const fileExists = project.files.some(file => file._id.toString() === fileId);
    if (!fileExists) {
      return res.status(404).json({ message: "File not found in this project." });
    }

    // Get file details for activity log
    const fileToDelete = project.files.find(file => file._id.toString() === fileId);

    // Remove file from project
    await projects.updateOne(
      { _id: new ObjectId(projectId) },
      { $pull: { files: { _id: new ObjectId(fileId) } } }
    );

    // Log activity
    await activities.insertOne({
      type: "file_deleted",
      project: new ObjectId(projectId),
      user: new ObjectId(userId),
      message: `Deleted file: ${fileToDelete.fileName}`,
      version: project.version,
      createdAt: new Date()
    });

    res.json({ 
      message: "File deleted successfully.",
      deletedFileId: fileId
    });

  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ message: "Failed to delete file." });
  }
});

// =================== ADMIN ENDPOINTS ===================

// GET - Admin Dashboard Stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;

    const totalUsers = await users.countDocuments();
    const totalProjects = await projects.countDocuments();
    const totalActivities = await activities.countDocuments();

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await users.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentProjects = await projects.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      totalUsers,
      totalProjects,
      totalActivities,
      recentUsers,
      recentProjects
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Failed to fetch admin stats." });
  }
});

// GET - All Users (Admin only)
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const allUsers = await users
      .find({})
      .project({ 
        username: 1, 
        email: 1, 
        role: 1, 
        createdAt: 1, 
        friends: 1,
        createdProjects: 1
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const totalUsers = await users.countDocuments();

    // Add additional stats for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const projects = req.app.locals.projects;
        const userProjects = await projects.countDocuments({ 
          "members.user": user._id 
        });
        
        return {
          ...user,
          friendCount: user.friends ? user.friends.length : 0,
          projectCount: userProjects
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        current: page,
        total: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// GET - All Projects (Admin only)
app.get("/api/admin/projects", requireAdmin, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const allProjects = await projects
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const totalProjects = await projects.countDocuments();

    // Populate owner information
    const populatedProjects = await Promise.all(
      allProjects.map(async (project) => {
        const owner = await users.findOne(
          { _id: project.owner },
          { projection: { username: 1, email: 1 } }
        );
        
        return {
          ...project,
          owner: owner ? { _id: project.owner, username: owner.username, email: owner.email } : null,
          memberCount: project.members ? project.members.length : 0,
          fileCount: project.files ? project.files.length : 0
        };
      })
    );

    res.json({
      projects: populatedProjects,
      pagination: {
        current: page,
        total: Math.ceil(totalProjects / limit),
        totalProjects
      }
    });
  } catch (err) {
    console.error("Admin projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects." });
  }
});

// PUT - Edit User (Admin only)
app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const userId = req.params.id;
    const { username, email, role } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required." });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
    }

    // Check if email is already taken by another user
    const existingUser = await users.findOne({ 
      email: email.trim(),
      _id: { $ne: new ObjectId(userId) }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use by another user." });
    }

    // Check if username is already taken by another user
    const existingUsername = await users.findOne({ 
      username: username.trim(),
      _id: { $ne: new ObjectId(userId) }
    });

    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use by another user." });
    }

    // Update user
    const updateFields = {
      username: username.trim(),
      email: email.trim()
    };

    if (role) {
      updateFields.role = role;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("Edit user error:", err);
    res.status(500).json({ message: "Failed to update user." });
  }
});

// DELETE - Delete User (Admin only)
app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;
    const userId = req.params.id;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: "Cannot delete admin users." });
    }

    // Delete user's projects
    await projects.deleteMany({ owner: new ObjectId(userId) });

    // Remove user from project memberships
    await projects.updateMany(
      { "members.user": new ObjectId(userId) },
      { $pull: { members: { user: new ObjectId(userId) } } }
    );

    // Remove from friends lists
    await users.updateMany(
      { friends: new ObjectId(userId) },
      { $pull: { friends: new ObjectId(userId) } }
    );

    // Delete user's activities
    await activities.deleteMany({ user: new ObjectId(userId) });

    // Finally delete the user
    await users.deleteOne({ _id: new ObjectId(userId) });

    res.json({ message: "User and associated data deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

// PUT - Edit Project (Admin only)
app.put("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const projectId = req.params.id;
    const { projectName, description, type, hashtags } = req.body;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    // Validate input
    if (!projectName) {
      return res.status(400).json({ message: "Project name is required." });
    }

    // Validate project type
    const allowedTypes = ["web application", "game", "mobile app", "desktop app", "library", "other"];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid project type." });
    }

    // Check if project name is already taken by another project
    const existingProject = await projects.findOne({ 
      projectName: projectName.trim(),
      _id: { $ne: new ObjectId(projectId) }
    });

    if (existingProject) {
      return res.status(400).json({ message: "Project name already in use." });
    }

    // Update project
    const updateFields = {
      projectName: projectName.trim(),
      description: description ? description.trim() : '',
      type: type || 'other',
      hashtags: Array.isArray(hashtags) ? hashtags.map(tag => tag.toLowerCase().trim()) : []
    };

    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ message: "Project updated successfully." });
  } catch (err) {
    console.error("Edit project error:", err);
    res.status(500).json({ message: "Failed to update project." });
  }
});

// DELETE - Delete Project (Admin only)
app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;
    const projectId = req.params.id;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Delete project activities
    await activities.deleteMany({ project: new ObjectId(projectId) });

    // Remove project from users' createdProjects array
    await req.app.locals.users.updateMany(
      { createdProjects: new ObjectId(projectId) },
      { $pull: { createdProjects: new ObjectId(projectId) } }
    );

    // Delete the project
    await projects.deleteOne({ _id: new ObjectId(projectId) });

    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("Admin delete project error:", err);
    res.status(500).json({ message: "Failed to delete project." });
  }
});

// GET - Recent Activity (Admin only)
app.get("/api/admin/activity", requireAdmin, async (req, res) => {
  try {
    const activities = req.app.locals.activities;
    const limit = parseInt(req.query.limit) || 50;

    const recentActivity = await activities.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          type: 1,
          message: 1,
          version: 1,
          createdAt: 1,
          "user.username": 1,
          "user.email": 1,
          "project.projectName": 1,
          "project.type": 1
        }
      }
    ]).toArray();

    res.json(recentActivity);
  } catch (err) {
    console.error("Admin activity error:", err);
    res.status(500).json({ message: "Failed to fetch recent activity." });
  }
});

// PUT - Edit Activity (Admin only)
app.put("/api/admin/activity/:id", requireAdmin, async (req, res) => {
  try {
    const activities = req.app.locals.activities;
    const activityId = req.params.id;
    const { message, type } = req.body;

    if (!ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    if (!message) {
      return res.status(400).json({ message: "Activity message is required." });
    }

    const updateFields = {
      message: message.trim()
    };

    if (type) {
      updateFields.type = type;
    }

    const result = await activities.updateOne(
      { _id: new ObjectId(activityId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Activity not found." });
    }

    res.json({ message: "Activity updated successfully." });
  } catch (err) {
    console.error("Edit activity error:", err);
    res.status(500).json({ message: "Failed to update activity." });
  }
});

// DELETE - Delete Activity (Admin only)
app.delete("/api/admin/activity/:id", requireAdmin, async (req, res) => {
  try {
    const activities = req.app.locals.activities;
    const activityId = req.params.id;

    if (!ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    const result = await activities.deleteOne({ _id: new ObjectId(activityId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Activity not found." });
    }

    res.json({ message: "Activity deleted successfully." });
  } catch (err) {
    console.error("Delete activity error:", err);
    res.status(500).json({ message: "Failed to delete activity." });
  }
});

// GET - Project Types (Admin only)
app.get("/api/admin/project-types", requireAdmin, async (req, res) => {
  try {
    // For now, return the hardcoded types. In future, this could be from database
    const projectTypes = [
      { id: 1, name: "web application", description: "Web-based applications" },
      { id: 2, name: "game", description: "Gaming applications" },
      { id: 3, name: "mobile app", description: "Mobile applications" },
      { id: 4, name: "desktop app", description: "Desktop applications" },
      { id: 5, name: "library", description: "Code libraries and frameworks" },
      { id: 6, name: "other", description: "Other project types" }
    ];
    
    res.json(projectTypes);
  } catch (err) {
    console.error("Get project types error:", err);
    res.status(500).json({ message: "Failed to fetch project types." });
  }
});

// POST - Add Project Type (Admin only)
app.post("/api/admin/project-types", requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Project type name is required." });
    }

    // Read current server.js file to modify the allowedTypes array
    const fs = require('fs');
    const path = require('path');
    const serverPath = __filename;
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Find the allowedTypes array and add the new type
    const allowedTypesRegex = /const allowedTypes = \[(.*?)\];/s;
    const match = serverContent.match(allowedTypesRegex);
    
    if (match) {
      const currentTypes = match[1];
      const newType = `"${name.toLowerCase().trim()}"`;
      
      // Check if type already exists
      if (currentTypes.includes(newType)) {
        return res.status(400).json({ message: "Project type already exists." });
      }
      
      const updatedTypes = currentTypes + `, ${newType}`;
      const newAllowedTypes = `const allowedTypes = [${updatedTypes}];`;
      
      serverContent = serverContent.replace(allowedTypesRegex, newAllowedTypes);
      
      // Write back to file (Note: This is for demo purposes, in production use database)
      fs.writeFileSync(serverPath, serverContent);
      
      res.json({ message: "Project type added successfully. Server restart required." });
    } else {
      res.status(500).json({ message: "Could not update project types." });
    }
  } catch (err) {
    console.error("Add project type error:", err);
    res.status(500).json({ message: "Failed to add project type." });
  }
});

// DELETE - Remove Project Type (Admin only)
app.delete("/api/admin/project-types/:name", requireAdmin, async (req, res) => {
  try {
    const typeName = req.params.name.toLowerCase();
    
    // Prevent deletion of core types
    const coreTypes = ["web application", "game", "mobile app", "desktop app", "library", "other"];
    if (coreTypes.includes(typeName)) {
      return res.status(400).json({ message: "Cannot delete core project types." });
    }

    // Read current server.js file to modify the allowedTypes array
    const fs = require('fs');
    const serverPath = __filename;
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Find the allowedTypes array and remove the type
    const allowedTypesRegex = /const allowedTypes = \[(.*?)\];/s;
    const match = serverContent.match(allowedTypesRegex);
    
    if (match) {
      let currentTypes = match[1];
      const typeToRemove = `"${typeName}"`;
      
      // Remove the type (handle comma placement)
      currentTypes = currentTypes.replace(new RegExp(`,\\s*${typeToRemove.replace(/"/g, '\\"')}|${typeToRemove.replace(/"/g, '\\"')}\\s*,?`, 'g'), '');
      
      const newAllowedTypes = `const allowedTypes = [${currentTypes}];`;
      serverContent = serverContent.replace(allowedTypesRegex, newAllowedTypes);
      
      // Write back to file
      fs.writeFileSync(serverPath, serverContent);
      
      res.json({ message: "Project type removed successfully. Server restart required." });
    } else {
      res.status(500).json({ message: "Could not update project types." });
    }
  } catch (err) {
    console.error("Remove project type error:", err);
    res.status(500).json({ message: "Failed to remove project type." });
  }
});

// Helper function for fuzzy search
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = getEditDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// SEARCH - Search Users (Public endpoint)
app.get("/api/search/users", async (req, res) => {
  try {
    const users = req.app.locals.users;
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Find exact and partial matches
    const exactMatches = await users.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'details.bio': { $regex: searchTerm, $options: 'i' } }
      ]
    }).project({
      username: 1,
      email: 1,
      'details.bio': 1,
      'details.avatar': 1,
      createdAt: 1
    }).limit(10).toArray();

    // If we have enough exact matches, return them
    if (exactMatches.length >= 5) {
      const results = exactMatches.map(user => {
        // Convert avatar to full URL if it exists
        if (user.details && user.details.avatar) {
          user.details.avatar = `http://localhost:3001${user.details.avatar}`;
        }
        return {
          ...user,
          type: 'user',
          similarity: 1.0
        };
      });
      return res.json(results);
    }

    // Get more users for fuzzy matching
    const allUsers = await users.find({}).project({
      username: 1,
      email: 1,
      'details.bio': 1,
      'details.avatar': 1,
      createdAt: 1
    }).toArray();

    // Calculate similarity scores and filter
    const fuzzyMatches = allUsers
      .map(user => {
        const usernameSim = calculateSimilarity(searchTerm, user.username || '');
        const emailSim = calculateSimilarity(searchTerm, user.email || '');
        const bioSim = calculateSimilarity(searchTerm, user.details?.bio || '');
        
        const maxSimilarity = Math.max(usernameSim, emailSim, bioSim);
        
        // Convert avatar to full URL if it exists
        if (user.details && user.details.avatar) {
          user.details.avatar = `http://localhost:3001${user.details.avatar}`;
        }
        
        return {
          ...user,
          type: 'user',
          similarity: maxSimilarity
        };
      })
      .filter(user => user.similarity > 0.4)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);

    res.json(fuzzyMatches);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ message: "Failed to search users." });
  }
});

// SEARCH - Search Projects (Public endpoint)
app.get("/api/search/projects", async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Find exact and partial matches
    const exactMatches = await projects.aggregate([
      {
        $match: {
          $or: [
            { projectName: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { hashtags: { $in: [new RegExp(searchTerm, 'i')] } },
            { type: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo"
        }
      },
      { $unwind: "$ownerInfo" },
      {
        $project: {
          projectName: 1,
          description: 1,
          hashtags: 1,
          type: 1,
          createdAt: 1,
          "ownerInfo.username": 1,
          memberCount: { $size: "$members" }
        }
      },
      { $limit: 10 }
    ]).toArray();

    // If we have enough exact matches, return them
    if (exactMatches.length >= 5) {
      const results = exactMatches.map(project => ({
        ...project,
        type: 'project',
        similarity: 1.0
      }));
      return res.json(results);
    }

    // Get more projects for fuzzy matching
    const allProjects = await projects.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo"
        }
      },
      { $unwind: "$ownerInfo" },
      {
        $project: {
          projectName: 1,
          description: 1,
          hashtags: 1,
          type: 1,
          createdAt: 1,
          "ownerInfo.username": 1,
          memberCount: { $size: "$members" }
        }
      }
    ]).toArray();

    // Calculate similarity scores and filter
    const fuzzyMatches = allProjects
      .map(project => {
        const nameSim = calculateSimilarity(searchTerm, project.projectName || '');
        const descSim = calculateSimilarity(searchTerm, project.description || '');
        const typeSim = calculateSimilarity(searchTerm, project.type || '');
        const hashtagSim = project.hashtags ? 
          Math.max(...project.hashtags.map(tag => calculateSimilarity(searchTerm, tag))) : 0;
        
        const maxSimilarity = Math.max(nameSim, descSim, typeSim, hashtagSim);
        
        return {
          ...project,
          type: 'project',
          similarity: maxSimilarity
        };
      })
      .filter(project => project.similarity > 0.4)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);

    res.json(fuzzyMatches);
  } catch (err) {
    console.error("Search projects error:", err);
    res.status(500).json({ message: "Failed to search projects." });
  }
});

// SEARCH - Combined Search (Public endpoint)
app.get("/api/search", async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ users: [], projects: [] });
    }

    // Use the same logic as individual endpoints but combine results
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;
    const searchTerm = query.trim().toLowerCase();
    
    // Search users
    const userMatches = await users.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'details.bio': { $regex: searchTerm, $options: 'i' } }
      ]
    }).project({
      username: 1,
      email: 1,
      'details.bio': 1,
      'details.avatar': 1,
      createdAt: 1
    }).limit(5).toArray();
    
    // Search projects
    const projectMatches = await projects.aggregate([
      {
        $match: {
          $or: [
            { projectName: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { hashtags: { $in: [new RegExp(searchTerm, 'i')] } },
            { type: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerInfo"
        }
      },
      { $unwind: "$ownerInfo" },
      {
        $project: {
          projectName: 1,
          description: 1,
          hashtags: 1,
          type: 1,
          createdAt: 1,
          "ownerInfo.username": 1,
          memberCount: { $size: "$members" }
        }
      },
      { $limit: 5 }
    ]).toArray();
    
    res.json({
      users: userMatches.map(user => {
        // Convert avatar to full URL if it exists
        if (user.details && user.details.avatar) {
          user.details.avatar = `http://localhost:3001${user.details.avatar}`;
        }
        return { ...user, type: 'user' };
      }),
      projects: projectMatches.map(project => ({ ...project, type: 'project' }))
    });
  } catch (err) {
    console.error("Combined search error:", err);
    res.status(500).json({ message: "Failed to perform search." });
  }
});

// TEMPORARY: Promote user to admin (remove this in production)
app.post("/api/promote-to-admin", async (req, res) => {
  try {
    const { email, adminKey } = req.body;
    
    // Security check - only allow with correct admin key
    if (adminKey !== 'admin123') {
      return res.status(403).json({ message: "Invalid admin key." });
    }

    const users = req.app.locals.users;
    const result = await users.updateOne(
      { email: email },
      { $set: { role: "admin" } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User promoted to admin successfully!" });
  } catch (err) {
    console.error("Promote to admin error:", err);
    res.status(500).json({ message: "Failed to promote user." });
  }
});
