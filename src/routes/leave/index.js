const express = require('express');
const router = express.Router();
const leaveController = require('../../controllers/leave');

// POST /leave/apply_leave.php
router.post(['/apply_leave.php', '/apply_leave'], leaveController.applyLeave);

// GET & POST /leave/balance_leave.php (and /get_balance_leave.php)
router.get(['/balance_leave.php', '/balance_leave', '/get_balance_leave.php', '/get_balance_leave'], leaveController.getBalanceLeave);
router.post(['/balance_leave.php', '/balance_leave', '/get_balance_leave.php', '/get_balance_leave'], leaveController.getBalanceLeave);

// GET & POST /leave/get_leave.php (and /get_leaves.php)
router.get(['/get_leave.php', '/get_leave', '/get_leaves.php', '/get_leaves'], leaveController.getLeaves);
router.post(['/get_leave.php', '/get_leave', '/get_leaves.php', '/get_leaves'], leaveController.getLeaves);

// POST /leave/approve_leave.php
router.post(['/approve_leave.php', '/approve_leave'], leaveController.approveLeave);

// POST /leave/add_comp_off.php
router.post(['/add_comp_off.php', '/add_comp_off'], leaveController.addCompOff);

// POST /leave/add_pl.php
router.post(['/add_pl.php', '/add_pl'], leaveController.addPL);

module.exports = router;
