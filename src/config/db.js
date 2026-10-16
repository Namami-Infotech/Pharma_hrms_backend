const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'namami',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'Sakshi@123',
  database: (process.env.DB_NAME || 'pharma_hrms').trim(),
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true, // Return dates as strings to match PDO behavior
  timezone: '+05:30'  // Match Indian Standard Time as used in PHP
});

// Helper to execute query with parameters (returns [rows, fields])
async function query(sql, params) {
  return await pool.query(sql, params);
}

// Helper to execute statement (returns [result, fields])
async function execute(sql, params) {
  return await pool.execute(sql, params);
}

// Get raw connection for transactions
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  query,
  execute,
  getConnection
};
