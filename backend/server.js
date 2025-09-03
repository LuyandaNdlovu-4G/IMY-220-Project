const express = require("express");
const path = require("path");

// CREATE APP
const app = express();
const port = 3000;

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});