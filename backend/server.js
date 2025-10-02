// server.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const { connectDB, getCollection, ObjectId } = require("./db");
const MongoDBStore = require("connect-mongodb-session")(session);
const auth = require("./middleware/auth");

const app = express();
const port = 3000;

app.use(express.json());

// Session store
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions"
});

store.on("error", error => {
    console.error("Session store error:", error);
});

app.use(session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));


const cors = require("cors");
app.use(cors({
    origin: "http://localhost:8080", //frontend URL
    credentials: true
}));



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
            createdProjects: []
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

        req.session.userId = existingUser._id.toString();

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
app.get("/api/users/me", auth, (req, res) => {
    res.json({
        id: req.user._id.toString(),
        username: req.user.username,
        email: req.user.email
    });
});


// POST - LOGOUT
app.post("/api/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully." });
    });
});


// POST - CREATE PROJECT
app.post("/api/projects", auth, async (req, res) => {
    const { projectName, description, hashtags, type, version } = req.body;

    if (!projectName || !description) {
        return res.status(400).json({ message: "Project name and description are required." });
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

        const newProject = {
            projectName: projectName.trim(),
            description: description.trim(),
            hashtags: Array.isArray(hashtags) ? hashtags.map(tag => tag.toLowerCase().trim()) : [],
            type: type || "other",
            version: version || "v1.0.0",
            owner: new ObjectId(req.user._id),
            members: [{
                user: new ObjectId(req.user._id),
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
            { _id: new ObjectId(req.user._id) },
            { $push: { createdProjects: result.insertedId } }
        );

        await activities.insertOne({
          user: new ObjectId(req.user._id),
          project: result.insertedId,
          type: "project_created",
          message: `${req.user.username} created project "${projectName}"`,
          version: version || "v1.0.0",
          createdAt: new Date()
        });

        res.status(201).json({
            message: "Project created successfully!",
            project: {
                id: result.insertedId.toString(),
                projectName: newProject.projectName,
                owner: req.user.username
            }
        });
    } catch (err) {
        console.error("Create project error:", err.stack);
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


//GET - PROJECTS
app.get("/api/projects/mine", auth, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;

    const results = await projects
      .find({ "members.user": new ObjectId(req.user._id) })
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
app.get("/api/projects/friends", auth, async (req, res) => {
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


//GET - PROJECT DETAILS
app.get("/api/projects/:id", auth, async (req, res) => {
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
      { _id: new ObjectId(req.params.id) }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if user is a member
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project." });
    }

    // Populate owner
    const owner = await users.findOne(
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

    // Populate files.uploadedBy
    const files = await Promise.all(
      (project.files || []).map(async (file) => {
        const uploadedByUser = await users.findOne(
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
      ...project,
      owner: owner ? { _id: project.owner, username: owner.username, email: owner.email } : null,
      members,
      files
    });
  } catch (err) {
    console.error("Error fetching project details:", err);
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
    const projects = req.app.locals.projects;

    if (!projects) {
      return res.status(500).json({ message: "Database not initialized." });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await projects.findOne({ _id: new ObjectId(req.params.id) });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if user is a member
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You must be a member to upload files." });
    }

    const newFile = {
      fileName,
      filePath,
      uploadedBy: ObjectId(req.user._id),
      size,
      mimeType
    };

    await projects.updateOne(
      { _id: project._id },
      { $push: { files: newFile }, $set: { updatedAt: new Date() } }
    );

    res.status(201).json({ message: "File added successfully!", file: newFile });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ message: "Failed to add file." });
  }
});


// //ADD FRIEND
app.post("/api/friends", auth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const users = req.app.locals.users;

    const friend = await users.findOne({ email });
    if (!friend) {
      return res.status(404).json({ message: "User not found." });
    }

    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as a friend." });
    }

    const isAlreadyFriend = req.user.friends.some(f => f.toString() === friend._id.toString());
    if (isAlreadyFriend) {
      return res.status(409).json({ message: "Already friends." });
    }

    await users.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $push: { friends: friend._id } }
    );

    res.json({ message: `Friend ${friend.username} added successfully!` });
  } catch (err) {
    console.error("Error adding friend:", err);
    res.status(500).json({ message: "Failed to add friend." });
  }
});


// //GET FRIENDS LIST
app.get("/api/friends", auth, async (req, res) => {
  try {
    const users = req.app.locals.users;

    const user = await users.findOne(
      { _id: ObjectId(req.user._id) },
      { projection: { friends: 1 } }
    );

    if (!user || !user.friends) {
      return res.json([]);
    }

    const friends = await users
      .find({ _id: { $in: user.friends.map(id => ObjectId(id)) } })
      .project({ username: 1, email: 1, createdAt: 1 })
      .toArray();

    res.json(friends);
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ message: "Failed to fetch friends." });
  }
});


// //GET FRIEND'S PROJECTS
app.get("/api/friends/:id/projects", auth, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const projects = req.app.locals.projects;

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid friend ID." });
    }

    const user = await users.findOne({ _id: ObjectId(req.user._id) });
    if (!user || !user.friends.includes(req.params.id)) {
      return res.status(403).json({ message: "Not your friend." });
    }

    const results = await projects
      .find({ "members.user": ObjectId(req.params.id) })
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
app.delete("/api/projects/:id", auth, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const users = req.app.locals.users;

    const project = await projects.findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (project.owner.toString() !== req.user._id.toString()) {
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
app.delete("/api/friends/:friendId", auth, async (req, res) => {
  try {
    const users = req.app.locals.users;

    await users.updateOne(
      { _id: ObjectId(req.user._id) },
      { $pull: { friends: ObjectId(req.params.friendId) } }
    );

    res.json({ message: "Unfriended successfully." });
  } catch (err) {
    console.error("Unfriend error:", err);
    res.status(500).json({ message: "Failed to unfriend." });
  }
});


// PUT - UPDATE PROJECT (owner only)
app.put("/api/projects/:id", auth, async (req, res) => {
  const { projectName, description, hashtags, type, version } = req.body;
  const projectId = req.params.id;

  try {
    const projects = req.app.locals.projects;

    const project = await projects.findOne({ _id: ObjectId(projectId) });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can edit this project." });
    }

    const updateFields = {};
    if (projectName !== undefined) updateFields.projectName = projectName.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (hashtags !== undefined) updateFields.hashtags = Array.isArray(hashtags)
      ? hashtags.map(tag => tag.toLowerCase().trim())
      : [];
    if (type !== undefined) updateFields.type = type;
    if (version !== undefined) updateFields.version = version;
    updateFields.updatedAt = new Date();

    await projects.updateOne(
      { _id: ObjectId(projectId) },
      { $set: updateFields }
    );

    const updatedProject = await projects.findOne({ _id: ObjectId(projectId) });

    res.json({
      message: "Project updated successfully!",
      project: {
        id: updatedProject._id.toString(),
        projectName: updatedProject.projectName,
        description: updatedProject.description,
        hashtags: updatedProject.hashtags,
        type: updatedProject.type,
        version: updatedProject.version,
        updatedAt: updatedProject.updatedAt
      }
    });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ message: "Failed to update project." });
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


//POST - CHECK OUT PROJECT
app.post("/api/projects/:id/checkout", auth, async (req, res) => {
  try {
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;

    const project = await projects.findOne({ _id: ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    // Check if user is a member
    const isMember = project.members?.some(m =>
      m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You must be a project member to check out." });
    }

    // Ensure project is not already checked out
    if (project.status !== "checkedIn") {
      return res.status(400).json({
        message: "Project is already checked out.",
        checkedOutBy: project.checkedOutBy
      });
    }

    // Lock the project
    await projects.updateOne(
      { _id: ObjectId(req.params.id) },
      { $set: { status: "checkedOut", checkedOutBy: ObjectId(req.user._id) } }
    );

    // Log activity
    await activities.insertOne({
      type: "checkout",
      project: project._id,
      user: ObjectId(req.user._id),
      createdAt: new Date()
    });

    res.json({
      message: "Project checked out successfully.",
      project: {
        id: project._id,
        status: "checkedOut",
        checkedOutBy: req.user.username
      }
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Failed to check out project." });
  }
});


// POST - CHECK IN PROJECT
app.post("/api/projects/:id/checkin", auth, async (req, res) => {
  const { message, version, newFiles = [] } = req.body;

  try {
    const projects = req.app.locals.projects;
    const activities = req.app.locals.activities;

    const project = await projects.findOne({ _id: ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: "Project not found." });

    // Only the user who checked out can check in
    if (project.checkedOutBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the user who checked out the project can check it in." });
    }

    // Prepare file metadata
    const fileMetadata = newFiles.map(f => ({
      fileName: f.fileName,
      filePath: f.filePath,
      uploadedBy: ObjectId(req.user._id),
      uploadedAt: new Date(),
      size: f.size,
      mimeType: f.mimeType
    }));

    // Update project
    await projects.updateOne(
      { _id: ObjectId(req.params.id) },
      {
        $push: { files: { $each: fileMetadata } },
        $set: {
          status: "checkedIn",
          checkedOutBy: null,
          ...(version && { version })
        }
      }
    );

    // Log activity
    const activityDoc = {
      type: "checkin",
      project: project._id,
      user: ObjectId(req.user._id),
      message: message || "No message provided.",
      version: version || project.version,
      files: fileMetadata.map(f => ({
        fileName: f.fileName,
        filePath: f.filePath
      })),
      createdAt: new Date()
    };
    const result = await activities.insertOne(activityDoc);

    res.json({
      message: "Project checked in successfully.",
      activity: {
        id: result.insertedId,
        message: activityDoc.message,
        version: activityDoc.version,
        filesAdded: activityDoc.files.length
      }
    });
  } catch (err) {
    console.error("Checkin error:", err);
    res.status(500).json({ message: "Failed to check in project." });
  }
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
app.get("/api/activity/local", auth, async (req, res) => {
  try {
    const users = req.app.locals.users;
    const activities = req.app.locals.activities;

    const user = await users.findOne({ _id: new ObjectId(req.user._id) });
    const friendIds = user.friends ? user.friends.map(f => new ObjectId(f)) : [];
    const userIds = [new ObjectId(req.user._id), ...friendIds];

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


// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
