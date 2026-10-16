const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/task');

// GET & POST /task/get_task.php
router.get(['/get_task.php', '/get_task'], taskController.getTask);
router.post(['/get_task.php', '/get_task'], taskController.getTask);

// POST /task/task_action.php
router.post(['/task_action.php', '/task_action'], taskController.taskAction);

module.exports = router;
