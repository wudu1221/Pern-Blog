// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

// Middleware to protect routes against unauthenticated users
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check if token exists in Authorization Header (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
    }

    // 2. Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user still exists in database
    const userQuery = 'SELECT id, email, role, full_name FROM users WHERE id = $1 AND is_active = true';
    const userResult = await db.query(userQuery, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists or is deactivated.' });
    }

    // 4. Grant access by attaching the user payload directly to the request object
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

// Middleware to restrict access to specific system roles
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by the preceding 'protect' middleware
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action.' 
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };