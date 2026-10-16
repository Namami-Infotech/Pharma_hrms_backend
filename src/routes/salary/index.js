const express = require('express');
const router = express.Router();
const salaryController = require('../../controllers/salary');

// POST /salary/add_salary.php
router.post(['/add_salary.php', '/add_salary'], salaryController.addSalary);

// POST /salary/calculate_salary.php
router.post(['/calculate_salary.php', '/calculate_salary'], salaryController.calculateSalary);

// GET & POST /salary/get_salary.php
router.get(['/get_salary.php', '/get_salary'], salaryController.getSalary);
router.post(['/get_salary.php', '/get_salary'], salaryController.getSalary);

// GET & POST /salary/salary_records.php (and /get_salary_records.php)
router.get(['/salary_records.php', '/salary_records', '/get_salary_records.php', '/get_salary_records'], salaryController.getSalaryRecords);
router.post(['/salary_records.php', '/salary_records', '/get_salary_records.php', '/get_salary_records'], salaryController.getSalaryRecords);

// GET & POST /salary/salary_slip.php (and /get_salary_slip.php)
router.get(['/salary_slip.php', '/salary_slip', '/get_salary_slip.php', '/get_salary_slip'], salaryController.getSalarySlip);
router.post(['/salary_slip.php', '/salary_slip', '/get_salary_slip.php', '/get_salary_slip'], salaryController.getSalarySlip);

module.exports = router;
