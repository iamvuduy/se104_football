const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key_change_this'; // Must be the same secret as in auth.js

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user payload to request object
        next(); // Pass control to the next middleware/route handler
    } catch (ex) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
