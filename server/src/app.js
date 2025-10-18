const express = require('express');
const cors = require('cors');
const teamRoutes = require('./routes/teams');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');

app.get('/', (req, res) => {
    res.send('Backend server is running.');
});

// Public route for authentication
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/teams', authMiddleware, teamRoutes);

// Admin-only routes
app.use('/api/users', authMiddleware, adminMiddleware, usersRoutes);

module.exports = app;
