const express = require('express');
const router = express.Router();
const supportController = require('../../controllers/support');

// POST /support/get_support.php
router.post(['/get_support.php', '/get_support'], supportController.getSupport);

// GET & POST /support/get_ticket.php
router.get(['/get_ticket.php', '/get_ticket'], supportController.getTicket);
router.post(['/get_ticket.php', '/get_ticket'], supportController.getTicket);

module.exports = router;
