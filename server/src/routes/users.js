const express = require("express");
const db = require("../database");
const router = express.Router();

// GET /api/users - Get all users
router.get("/", (req, res) => {
  db.all(
    `SELECT id, username, role, full_name AS fullName, email, dob, position FROM users`,
    [],
    (err, users) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }
      res.json(users);
    }
  );
});

// PUT /api/users/:id/role - Update user role
router.put("/:id/role", (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!role) {
    return res.status(400).json({ message: "Role is required." });
  }

  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: `User role updated successfully.` });
  });
});

// DELETE /api/users/:id - Delete a user
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM users WHERE id = ?`, id, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: `User deleted successfully.` });
  });
});

module.exports = router;
