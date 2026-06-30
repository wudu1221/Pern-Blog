// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the connection pool using environmental variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Utility event listeners for monitoring backend database health
pool.on('connect', () => {
  console.log('🔄 Database connection pool established successfully.');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error on idle client:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Exporting raw pool if we need transaction management later
};