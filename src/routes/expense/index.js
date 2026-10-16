const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/expense');

// POST /expense/apply_expense.php
router.post(['/apply_expense.php', '/apply_expense'], expenseController.applyExpense);

// GET & POST /expense/get_expense.php
router.get(['/get_expense.php', '/get_expense'], expenseController.getExpense);
router.post(['/get_expense.php', '/get_expense'], expenseController.getExpense);

// POST /expense/update_expense.php
router.post(['/update_expense.php', '/update_expense'], expenseController.updateExpense);

module.exports = router;
