const { pool } = require('../../config/db');
const { sendMail } = require('../../config/mailer');

const sendBirthdayWishes = async (req, res, next) => {
  try {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${month}-${day}`;

    const [rows] = await pool.query(
      `SELECT Name, EmailId, DOB FROM Employees WHERE DATE_FORMAT(DOB, '%m-%d') = ? AND IsActive = 1`,
      [today]
    );

    if (rows.length === 0) {
      return res.send('No birthdays today.');
    }

    let output = '';

    for (const emp of rows) {
      const name = emp.Name;
      const email = emp.EmailId;

      try {
        await transporter.sendMail({
          from: mailFrom,
          to: `"${name}" <${email}>`,
          replyTo: mailFrom,
          subject: 'Happy Birthday!',
          html: `
            <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 0; color: #333;">
              <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <div style="background-color: #1B3156; color: #ffffff; text-align: center; padding: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">Happy Birthday, ${name}!</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                  <img src="https://img.freepik.com/free-photo/delicious-cake-candles-arrangement_23-2149023576.jpg" alt="Birthday Cake" style="width: 100px; height: 100px; border-radius: 50%;">
                  <h2 style="color: #6695AF; font-size: 28px; margin: 20px 0 10px;">Wishing you a day filled with love and joy!</h2>
                  <p style="font-size: 18px; margin: 10px 0;">Dear ${name},</p>
                  <p style="font-size: 18px; margin: 10px 0;">We at Namami Infotech hope this special day brings you lots of happiness, wonderful memories, and the opportunity to relax and enjoy your time with loved ones.</p>
                  <p style="font-size: 18px; margin: 10px 0;">May all your dreams come true and the year ahead be filled with success and prosperity!</p>
                  <a href="https://namami-infotech.com/birthday-wishes" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #1B3156; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px;">Celebrate with us</a>
                </div>
                <div style="background-color: #f7f7f7; color: #888; text-align: center; padding: 20px; font-size: 14px;">
                  <p style="margin: 0;">With warmest wishes from,</p>
                  <p style="margin: 0;">Your Namami Infotech Family</p>
                </div>
              </div>
            </body>
          `
        });

        output += `Birthday message sent to ${name} (${email})<br>`;
      } catch (err) {
        output += `Message could not be sent to ${name} (${email}). Mailer Error: ${err.message}<br>`;
      }
    }

    return res.send(output);
  } catch (err) {
    return res.status(500).send('Error processing birthday wishes: ' + err.message);
  }
};

// POST /src/Demo/Demo.php;

module.exports = sendBirthdayWishes;
