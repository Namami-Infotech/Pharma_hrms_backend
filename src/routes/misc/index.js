const express = require('express');
const router = express.Router();
const miscController = require('../../controllers/misc');

// GET & POST /birthday.php (and /birthday/index.php)
router.get(['/birthday.php', '/birthday', '/birthday/index.php', '/birthday/index'], miscController.sendBirthdayWishes);
router.post(['/birthday.php', '/birthday', '/birthday/index.php', '/birthday/index'], miscController.sendBirthdayWishes);

// POST /demo.php (and /Demo/Demo.php)
router.post(['/demo.php', '/demo', '/Demo/Demo.php', '/Demo/Demo'], miscController.requestDemo);

// GET & POST /test_db.php
router.get(['/test_db.php', '/test_db'], miscController.testDb);
router.post(['/test_db.php', '/test_db'], miscController.testDb);

module.exports = router;
