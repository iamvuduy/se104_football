const isAdmin = (req, res, next) => {
  // This middleware should be used AFTER the auth middleware
  const userRole = req.user?.role;
  // Accept both 'admin' (legacy), 'system_admin', and 'tournament_admin'
  if (
    req.user &&
    (userRole === "admin" ||
      userRole === "system_admin" ||
      userRole === "tournament_admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admins only." });
  }
};

module.exports = isAdmin;
