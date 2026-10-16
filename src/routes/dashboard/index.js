const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard');

// GET & POST /dashboard/dashboard.php
router.get(['/dashboard.php', '/dashboard'], dashboardController.getDashboard);
router.post(['/dashboard.php', '/dashboard'], dashboardController.getDashboard);

module.exports = router;
