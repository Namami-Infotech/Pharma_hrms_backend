const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth');

// POST /auth/login.php
router.post(['/login.php', '/login'], authController.login);

// POST /auth/new_login.php
router.post(['/new_login.php', '/new_login'], authController.newLogin);

// POST /auth/otp.php (and /verify_otp)
router.post(['/otp.php', '/otp', '/verify_otp.php', '/verify_otp'], authController.verifyOtp);

// POST /auth/devices.php (and /manage_devices)
router.post(['/devices.php', '/devices', '/manage_devices.php', '/manage_devices'], authController.manageDevices);

// POST /auth/change_password.php
router.post(['/change_password.php', '/change_password'], authController.changePassword);

// POST /auth/forget_password.php
router.post(['/forget_password.php', '/forget_password'], authController.forgetPassword);

// GET & POST /auth/get_office_details.php (and /office_details_function.php)
router.get(['/get_office_details.php', '/get_office_details', '/office_details_function.php', '/office_details_function'], authController.getOfficeDetails);
router.post(['/get_office_details.php', '/get_office_details', '/office_details_function.php', '/office_details_function'], authController.getOfficeDetails);

// GET & POST /auth/get_menu_by_tenent.php
router.get(['/get_menu_by_tenent.php', '/get_menu_by_tenent'], authController.getMenuByTenent);
router.post(['/get_menu_by_tenent.php', '/get_menu_by_tenent'], authController.getMenuByTenent);

module.exports = router;
