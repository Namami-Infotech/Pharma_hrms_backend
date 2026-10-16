const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification');

// POST /notification/add_notification.php
router.post(['/add_notification.php', '/add_notification'], notificationController.addNotification);

// GET & POST /notification/get_notification.php
router.get(['/get_notification.php', '/get_notification'], notificationController.getNotification);
router.post(['/get_notification.php', '/get_notification'], notificationController.getNotification);

module.exports = router;
