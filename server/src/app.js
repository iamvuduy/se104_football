const express = require("express");
const cors = require("cors");
const teamRoutes = require("./routes/teams");
const scheduleRoutes = require("./routes/schedules");
const groupRoutes = require("./routes/groups");
const resultRoutes = require("./routes/results");
const leaderboardRoutes = require("./routes/leaderboard"); // Import leaderboard routes
const playerRoutes = require("./routes/players");
const settingsRoutes = require("./routes/settings");
const permissionsRoutes = require("./routes/permissions");
const rolesRoutes = require("./routes/roles");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);
app.use(express.json()); // for parsing application/json

// Routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const authMiddleware = require("./middleware/auth");
const adminMiddleware = require("./middleware/admin");

app.get("/", (req, res) => {
  res.send("Backend server is running.");
});

// Public route for authentication
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/teams", authMiddleware, teamRoutes);
app.use("/api/schedules", authMiddleware, scheduleRoutes);
app.use("/api/results", authMiddleware, resultRoutes);
app.use("/api/players", authMiddleware, playerRoutes);
app.use("/api/leaderboard", authMiddleware, leaderboardRoutes); // Use leaderboard routes
app.use("/api/settings", authMiddleware, settingsRoutes);
app.use("/api/permissions", authMiddleware, permissionsRoutes);

// Roles management (admin)
app.use("/api/roles", authMiddleware, rolesRoutes);

// User routes - /me endpoint for all authenticated users
app.use("/api/users", authMiddleware, usersRoutes);

// Admin-only routes
app.use("/api/groups", authMiddleware, groupRoutes);

module.exports = app;
