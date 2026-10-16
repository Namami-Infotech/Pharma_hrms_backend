const express = require('express');
const router = express.Router();
const travelController = require('../../controllers/travel');

// POST /travel/apply_travel.php
router.post(['/apply_travel.php', '/apply_travel'], travelController.applyTravel);

// GET & POST /travel/get_travel.php
router.get(['/get_travel.php', '/get_travel'], travelController.getTravel);
router.post(['/get_travel.php', '/get_travel'], travelController.getTravel);

// POST /travel/update_status.php (and /update_travel_status.php)
router.post(['/update_status.php', '/update_status', '/update_travel_status.php', '/update_travel_status'], travelController.updateTravelStatus);

module.exports = router;
