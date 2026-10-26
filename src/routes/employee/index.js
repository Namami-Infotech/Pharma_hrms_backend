const express = require('express');
const router = express.Router();
const employeeController = require('../../controllers/employee');
const { uploadEmployeeImage } = require('../../middleware/upload');

// POST /employee/add_employee.php
router.post(['/add_employee.php', '/add_employee'], (req, res, next) => {
  uploadEmployeeImage.single('image')(req, res, (err) => {
    next();
  });
}, employeeController.addEmployee);

// POST /employee/edit_employee.php
router.post(['/edit_employee.php', '/edit_employee'], employeeController.editEmployee);

// GET & POST /employee/list_employee.php
router.get(['/list_employee.php', '/list_employee', '/list_employees.php', '/list_employees'], employeeController.listEmployees);
router.post(['/list_employee.php', '/list_employee', '/list_employees.php', '/list_employees'], employeeController.listEmployees);

// GET & POST /employee/view_employee.php
router.get(['/view_employee.php', '/view_employee'], employeeController.viewEmployee);
router.post(['/view_employee.php', '/view_employee'], employeeController.viewEmployee);

// GET & POST /employee/get_next_emp_id.php
router.get(['/get_next_emp_id.php', '/get_next_emp_id'], employeeController.getNextEmpId);
router.post(['/get_next_emp_id.php', '/get_next_emp_id'], employeeController.getNextEmpId);

// POST /employee/disable_employee.php
router.post(['/disable_employee.php', '/disable_employee'], employeeController.disableEmployee);

// POST /employee/add_office.php
router.post(['/add_office.php', '/add_office'], employeeController.addOffice);

// GET & POST /employee/get_office.php
router.get(['/get_office.php', '/get_office'], employeeController.getOffice);
router.post(['/get_office.php', '/get_office'], employeeController.getOffice);

// POST /employee/upload_employee_image.php (and /upload_image.php)
router.post(['/upload_employee_image.php', '/upload_employee_image', '/upload_image.php', '/upload_image'], (req, res, next) => {
  uploadEmployeeImage.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, employeeController.uploadEmployeeImage);

module.exports = router;
