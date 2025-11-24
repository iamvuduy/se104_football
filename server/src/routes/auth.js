const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database");
const router = express.Router();

const JWT_SECRET = "your_super_secret_key_change_this"; // Change this to an environment variable in production

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { username, password, email, fullName, dob, position } = req.body;

  if (!username || !password || !email || !fullName || !dob) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const trimmedUsername = String(username).trim();
  const trimmedFullName = String(fullName).trim();
  const trimmedPosition = position ? String(position).trim() : "";
  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordValue = String(password);

  if (!trimmedUsername || !trimmedFullName || !normalizedEmail) {
    return res.status(400).json({ message: "Invalid registration details." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  const parsedDob = new Date(dob);
  if (Number.isNaN(parsedDob.getTime())) {
    return res.status(400).json({ message: "Invalid date of birth." });
  }
  const dateOnlyDob = parsedDob.toISOString().split("T")[0];

  const canonicalPosition = trimmedPosition
    ? trimmedPosition
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";
  let assignedRole = "viewer";
  if (canonicalPosition === "ban to chuc giai") {
    assignedRole = "tournament_admin";
  } else if (canonicalPosition === "chu doi bong") {
    assignedRole = "team_owner";
  }

  const positionToStore = trimmedPosition || "Khán giả";

  if (passwordValue.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  // Check if username or email already exists
  db.get(
    `SELECT username, email FROM users WHERE username = ? COLLATE NOCASE OR lower(email) = ?`,
    [trimmedUsername, normalizedEmail],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Database error on user check.",
          error: err.message,
        });
      }
      if (row) {
        if (
          row.username &&
          row.username.toLowerCase() === trimmedUsername.toLowerCase()
        ) {
          return res.status(400).json({ message: "Username already exists." });
        }
        if (row.email && row.email.toLowerCase() === normalizedEmail) {
          return res.status(400).json({ message: "Email already in use." });
        }
        return res.status(400).json({ message: "Account already exists." });
      }

      bcrypt.hash(passwordValue, 10, (hashErr, hash) => {
        if (hashErr) {
          return res.status(500).json({
            message: "Error hashing password.",
            error: hashErr.message,
          });
        }

        db.run(
          `
                        INSERT INTO users (username, password, role, full_name, email, dob, position)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
          [
            trimmedUsername,
            hash,
            assignedRole,
            trimmedFullName,
            normalizedEmail,
            dateOnlyDob,
            positionToStore,
          ],
          function (insertErr) {
            if (insertErr) {
              return res.status(500).json({
                message: "Database error on user creation.",
                error: insertErr.message,
              });
            }
            res.status(201).json({
              message: `User ${trimmedUsername} created successfully.`,
            });
          }
        );
      });
    }
  );
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const identifier = String(username || "").trim();
  const passwordValue = String(password || "");

  if (!identifier || !passwordValue) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? COLLATE NOCASE OR lower(email) = ?`,
    [identifier, identifier.toLowerCase()],
    (err, user) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      bcrypt.compare(passwordValue, user.password, (compareErr, result) => {
        if (compareErr) {
          return res
            .status(500)
            .json({ message: "Error comparing passwords." });
        }
        if (!result) {
          return res.status(401).json({ message: "Invalid credentials." });
        }

        // Passwords match, create JWT
        const payload = {
          id: user.id,
          username: user.username,
          role: user.role || "user",
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
          if (err) {
            return res.status(500).json({ message: "Error signing token." });
          }
          res.json({
            message: "Logged in successfully.",
            token: token,
          });
        });
      });
    }
  );
});

module.exports = router;
