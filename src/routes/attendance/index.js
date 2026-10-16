const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/attendance');

// POST /attendance/mark_attendance.php
router.post(['/mark_attendance.php', '/mark_attendance'], attendanceController.markAttendance);

// POST /attendance/mark_attendance1.php
router.post(['/mark_attendance1.php', '/mark_attendance1'], attendanceController.markAttendance1);

// GET & POST /attendance/mobile_attendance.php (and /get_mobile_attendance.php)
router.get(['/mobile_attendance.php', '/mobile_attendance', '/get_mobile_attendance.php', '/get_mobile_attendance'], attendanceController.getMobileAttendance);
router.post(['/mobile_attendance.php', '/mobile_attendance', '/get_mobile_attendance.php', '/get_mobile_attendance'], attendanceController.getMobileAttendance);

// POST /attendance/mark_manual_attendance.php
router.post(['/mark_manual_attendance.php', '/mark_manual_attendance'], attendanceController.markManualAttendance);

// GET & POST /attendance/get_attendance.php (and /get_raw_attendance.php)
router.get(['/get_attendance.php', '/get_attendance', '/get_raw_attendance.php', '/get_raw_attendance'], attendanceController.getRawAttendance);
router.post(['/get_attendance.php', '/get_attendance', '/get_raw_attendance.php', '/get_raw_attendance'], attendanceController.getRawAttendance);

// GET & POST /attendance/get_today_attendance.php
router.get(['/get_today_attendance.php', '/get_today_attendance'], attendanceController.getTodayAttendance);
router.post(['/get_today_attendance.php', '/get_today_attendance'], attendanceController.getTodayAttendance);

// GET & POST /attendance/view_attendance.php
router.get(['/view_attendance.php', '/view_attendance'], attendanceController.viewAttendance);
router.post(['/view_attendance.php', '/view_attendance'], attendanceController.viewAttendance);

// GET & POST /attendance/attendance.php (and /process_attendance.php)
router.get(['/attendance.php', '/attendance', '/process_attendance.php', '/process_attendance'], attendanceController.processAttendance);
router.post(['/attendance.php', '/attendance', '/process_attendance.php', '/process_attendance'], attendanceController.processAttendance);

// POST /attendance/regularise.php (and /apply_regularise.php)
router.post(['/regularise.php', '/regularise', '/apply_regularise.php', '/apply_regularise'], attendanceController.applyRegularise);

// GET & POST /attendance/get_regularise.php
router.get(['/get_regularise.php', '/get_regularise'], attendanceController.getRegularise);
router.post(['/get_regularise.php', '/get_regularise'], attendanceController.getRegularise);

// POST /attendance/update_regularise.php
router.post(['/update_regularise.php', '/update_regularise'], attendanceController.updateRegularise);

// GET & POST /attendance/correct_activity.php
router.get(['/correct_activity.php', '/correct_activity'], attendanceController.correctActivity);
router.post(['/correct_activity.php', '/correct_activity'], attendanceController.correctActivity);

module.exports = router;
