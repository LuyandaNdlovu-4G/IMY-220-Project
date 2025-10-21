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
                email: existingUser.email
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
    console.lof(userId, username);
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
          { projection: { username: 1, email: 1 } }
        );
        return {
          ...m,
          user: memberUser ? { _id: m.user, username: memberUser.username, email: memberUser.email } : null
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

// GET - SEARCH
app.get("/api/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;

    if (type === "user") {
      const matchedUsers = await users.find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } }
        ]
      }).project({ username: 1, email: 1 }).toArray();

      return res.json(matchedUsers);
    } else {
      const matchedProjects = await projects.find({
        $or: [
          { projectName: { $regex: q, $options: "i" } },
          { hashtags: q.toLowerCase() }
        ]
      }).project({
        projectName: 1,
        description: 1,
        type: 1,
        hashtags: 1
      }).toArray();
      
      return res.json(matchedProjects);
    }
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Failed to perform search." });
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

  const fileToCheckIn = project.files.find(f => f._id.toString() === fileId);
  if (fileToCheckIn.checkedOutBy?.toString() !== userId) {
      return res.status(403).json({ message: "You cannot check in a file you did not check out." });
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

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only the owner can edit this project." });
    }

    // Prepare update fields
    const updateFields = {};
    if (projectName !== undefined) updateFields.projectName = projectName.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (hashtags !== undefined) {
        const parsedHashtags = typeof hashtags === 'string' ? hashtags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        updateFields.hashtags = parsedHashtags;
    }
    if (type !== undefined) updateFields.type = type;
    if (version !== undefined) updateFields.version = version;
    updateFields.updatedAt = new Date();

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

  if (project.owner.toString() !== userId) {
    return res.status(403).json({ message: "Only the project owner can add files." });
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
