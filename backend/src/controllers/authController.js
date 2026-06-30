// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

// Helper function to sign JWT payload
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 1. REGISTER USER
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Guard: Prevent malicious role-escalation to admin during public signup
    const assignedRole = (role === 'admin') ? 'reader' : (role || 'reader');

    // Hash the password with a work factor cost of 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into PostgreSQL
    const insertQuery = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, created_at;
    `;
    
    const result = await db.query(insertQuery, [email, passwordHash, fullName, assignedRole]);
    const newUser = result.rows[0];

    // Issue Token immediately upon registration
    const token = signToken(newUser.id);

    res.status(201).json({
      status: 'success',
      token,
      data: { user: newUser }
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation error code
      return res.status(400).json({ message: 'Email address already registered.' });
    }
    res.status(500).json({ message: 'Server registration failure.', error: error.message });
  }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Locate user
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await db.query(query, [email]);
    const user = result.rows[0];

    // Verify user existence and password validity
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // Generate token
    const token = signToken(user.id);

    // Strip password hash from client visibility
    delete user.password_hash;

    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server login failure.', error: error.message });
  }
};