const { pool } = require('../../config/db');

const addNotification = async (req, res, next) => {
  try {
    const data = req.body || {};
    const subject = data.subject || '';
    const body = data.body || '';
    const url = data.url || '';
    let pushTime = data.push_time || null;
    const image = data.image || null;
    const tenentId = data.Tenent_Id || null;

    if (!subject || !body || !tenentId) {
      return res.json({ success: false, message: 'Subject, body, and Tenent_Id are required.' });
    }

    if (!pushTime) {
      // Current date/time YYYY-MM-DD HH:mm:ss
      const now = new Date();
      pushTime = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    // 1. Insert notification into database
    await pool.query(
      `INSERT INTO Notifications (subject, body, url, push_time, image, Tenent_Id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [subject, body, url, pushTime, image, tenentId]
    );

    // 2. Fetch all FCM tokens for this tenant
    const [employees] = await pool.query(
      'SELECT fcm_token FROM Employees WHERE Tenent_Id = ? AND fcm_token IS NOT NULL AND fcm_token != ""',
      [tenentId]
    );

    const tokens = employees.map(emp => emp.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'Notification added, but no FCM tokens found for this tenant.'
      });
    }

    // 3. Send FCM notification to tokens
    const fcmResult = await sendFCMNotification(
      tokens,
      { title: subject, body, image },
      { url: String(url), Tenent_Id: String(tenentId) }
    );

    return res.json({
      success: true,
      message: `Notification added successfully. Push sent to ${fcmResult.sentCount} users.`
    });
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message });
  }
};

// GET /src/notification/get_notification.php;

module.exports = addNotification;
