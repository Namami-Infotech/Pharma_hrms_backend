const { pool } = require('../../config/db');
const { sendMail } = require('../../config/mailer');

const testDb = async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.send('Database connection is working!');
  } catch (err) {
    return res.status(500).send('Error: ' + err.message);
  }
};

module.exports = testDb;
