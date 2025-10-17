const express = require('express');
const cors = require('cors');
const teamRoutes = require('./routes/teams');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Routes
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

app.get('/', (req, res) => {
    res.send('Backend server is running.');
});

// Public route for authentication
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/teams', authMiddleware, teamRoutes);

module.exports = app;
