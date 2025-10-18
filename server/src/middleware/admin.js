const isAdmin = (req, res, next) => {
    // This middleware should be used AFTER the auth middleware
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only.' });
    }
};

module.exports = isAdmin;
