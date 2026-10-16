const express = require('express');
const router = express.Router();
const trackController = require('../../controllers/track');

// POST /track/add_location.php
router.post(['/add_location.php', '/add_location'], trackController.addLocation);

// GET & POST /track/address.php
router.get(['/address.php', '/address'], trackController.getAddress);
router.post(['/address.php', '/address'], trackController.getAddress);

// GET & POST /track/get_location.php
router.get(['/get_location.php', '/get_location'], trackController.getLocation);
router.post(['/get_location.php', '/get_location'], trackController.getLocation);

module.exports = router;
