const express = require("express");
const db = require("../database");
const bcrypt = require("bcrypt");
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

// PUT /api/users/:id - Update user information
router.put("/:id", (req, res) => {
  const { fullName, email, dob, position } = req.body;
  const { id } = req.params;

  // Build dynamic update query based on provided fields
  const updates = [];
  const values = [];

  if (fullName !== undefined) {
    updates.push('full_name = ?');
    values.push(fullName);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (dob !== undefined) {
    updates.push('dob = ?');
    values.push(dob);
  }
  if (position !== undefined) {
    updates.push('position = ?');
    values.push(position);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No fields to update." });
  }

  values.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User information updated successfully." });
  });
});

// PUT /api/users/:id/password - Update user password
router.put("/:id/password", async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ message: "New password is required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.run(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashedPassword, id],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error.", error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: "User not found." });
        }
        res.json({ message: "Password updated successfully." });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error hashing password.", error: error.message });
  }
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
