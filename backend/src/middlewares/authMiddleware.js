// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

// Middleware to protect routes against unauthenticated users
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log("❌ Auth Error: No token found in incoming headers");
      return res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
    }

    // 🔴 DEBUG LOG 1: Check if your environment variables are loading correctly
    console.log("Checking JWT_SECRET availability:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ UNDEFINED");

    // 2. Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔴 DEBUG LOG 2: Check what properties are actually inside the token
    console.log("Decoded Token Payload:", decoded);

    // 3. Check if user still exists in database
    const userQuery = 'SELECT id, email, role, full_name FROM users WHERE id = $1 AND is_active = true';
    
    // 🔴 DEBUG LOG 3: What ID are we passing to PostgreSQL?
    console.log("Querying database for user ID:", decoded.id);
    
    const userResult = await db.query(userQuery, [decoded.id]);

    if (userResult.rows.length === 0) {
      console.log("❌ Auth Error: Database returned 0 rows for this user ID (or is_active is false)");
      return res.status(401).json({ message: 'The user belonging to this token no longer exists or is deactivated.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    // 🔴 DEBUG LOG 4: Catch the exact system error message
    console.error("🔥 Catch Block Triggered! Error details:", error.message);
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