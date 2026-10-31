const express = require('express');
const router = express.Router();
const advanceController = require('../../controllers/advance');

// Apply for advance payment request
router.post(['/apply_advance.php', '/apply_advance', '/apply'], advanceController.applyAdvance);

// Get advance payment requests (supports both GET and POST for compatibility)
router.get(['/get_advances.php', '/get_advance.php', '/get_advances', '/get_advance', '/'], advanceController.getAdvances);
router.post(['/get_advances.php', '/get_advance.php', '/get_advances', '/get_advance', '/'], advanceController.getAdvances);

// Approve or reject advance payment request
router.post(['/approve_advance.php', '/approve_advance', '/approve'], advanceController.approveAdvance);

module.exports = router;
