const db = require('../src/config/db');

async function setupSettingsTable() {
  try {
    console.log('Checking / creating settings table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert default quotation_approval_threshold = 35 if not exists
    await db.query(`
      INSERT INTO settings (setting_key, setting_value, description)
      VALUES ('quotation_approval_threshold', '35', 'Discount percentage threshold above which RM approval is required (default 35%)')
      ON DUPLICATE KEY UPDATE setting_key = setting_key;
    `);

    const [rows] = await db.query('SELECT * FROM settings');
    console.log('Settings in DB:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error setting up settings table:', err);
    process.exit(1);
  }
}

setupSettingsTable();
