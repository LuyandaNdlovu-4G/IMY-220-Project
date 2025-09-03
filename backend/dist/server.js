import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname equivalent for ES modules
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);

// CREATE APP
var app = express();
var port = 3000;

// Serve static files from frontend/public
app.use(express["static"](path.join(__dirname, "../frontend/public")));

// Catch-all route → always return index.html
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// Start server
app.listen(port, function () {
  console.log("Listening on http://localhost:".concat(port));
});