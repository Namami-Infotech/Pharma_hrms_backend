const express = require('express');
const router = express.Router();
const dealerController = require('../../controllers/dealer');

// POST /dealer/add_dealers.php (and /add_dealer.php)
router.post(['/add_dealers.php', '/add_dealers', '/add_dealer.php', '/add_dealer'], dealerController.addDealer);

// GET & POST /dealer/get_dealers.php
router.get(['/get_dealers.php', '/get_dealers'], dealerController.getDealers);
router.post(['/get_dealers.php', '/get_dealers'], dealerController.getDealers);

// GET & POST /dealer/get_dealer_fields.php
router.get(['/get_dealer_fields.php', '/get_dealer_fields'], dealerController.getDealerFields);
router.post(['/get_dealer_fields.php', '/get_dealer_fields'], dealerController.getDealerFields);

module.exports = router;
