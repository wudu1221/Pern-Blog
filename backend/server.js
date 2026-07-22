// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const userRoutes = require('./src/routes/userRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes'); // Import category routes
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Global Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON request bodies
// 2. API Routes
app.use('/api/v1/auth', authRoutes);   
// 3. Post Routes (Public + Secure)
app.use('/api/v1/posts', postRoutes);
// 4. Comment Routes (Public + Secure)
app.use('/api/v1/comments', commentRoutes);
// 5. User Routes (Public)  
app.use('/api/v1/users', userRoutes);
// 6. Payment Routes (Highly Secure)
app.use('/api/v1/payments', paymentRoutes);
// 7. Admin Routes (Highly Secure)
app.use('/api/v1/admin', adminRoutes);
// 8. Category Routes (Public)
app.use('/api/v1/categories', categoryRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

 

// // 2. Base Diagnostic Route
// app.get('/api/v1/health', async (req, res) => {
//   try {
//     // Send a lightweight query to the DB to verify active status
//     const dbResult = await db.query('SELECT NOW()');
//     res.status(200).json({
//       status: 'success',
//       message: 'Server is up and running!',
//       databaseTime: dbResult.rows[0].now
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: 'Server is running, but database connection failed.',
//       error: error.message
//     });
//   }
// });

// 3. Start Server Execution
app.listen(PORT, () => {
  console.log(`🚀 Senior Architect API Server live on http://localhost:${PORT}`);
});