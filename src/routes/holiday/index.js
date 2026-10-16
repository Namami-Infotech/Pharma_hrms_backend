const express = require('express');
const router = express.Router();
const holidayController = require('../../controllers/holiday');

// POST /holiday/add_holiday.php
router.post(['/add_holiday.php', '/add_holiday'], holidayController.addHoliday);

// POST /holiday/edit_holiday.php
router.post(['/edit_holiday.php', '/edit_holiday'], holidayController.editHoliday);

// GET & POST /holiday/view_holiday.php
router.get(['/view_holiday.php', '/view_holiday'], holidayController.viewHoliday);
router.post(['/view_holiday.php', '/view_holiday'], holidayController.viewHoliday);

module.exports = router;
