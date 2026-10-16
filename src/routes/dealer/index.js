const express = require('express');
const router = express.Router();
const dealerController = require('../../controllers/dealer');

// POST /dealer/add_dealers.php (and /add_dealer.php)
router.post(['/add_dealers.php', '/add_dealers', '/add_dealer.php', '/add_dealer'], dealerController.addDealer);

// GET & POST /dealer/get_dealers.php
router.get(['/get_dealers.php', '/get_dealers'], dealerController.getDealers);
router.post(['/get_dealers.php', '/get_dealers'], dealerController.getDealers);

module.exports = router;
