const addEmployee = require('./addEmployee');
const editEmployee = require('./editEmployee');
const listEmployees = require('./listEmployees');
const viewEmployee = require('./viewEmployee');
const disableEmployee = require('./disableEmployee');
const addOffice = require('./addOffice');
const getOffice = require('./getOffice');
const uploadEmployeeImage = require('./uploadEmployeeImage');
const getNextEmpId = require('./getNextEmpId');
const { hashPassword } = require('./employeeHelper');

module.exports = {
  addEmployee,
  editEmployee,
  listEmployees,
  viewEmployee,
  disableEmployee,
  addOffice,
  getOffice,
  uploadEmployeeImage,
  getNextEmpId,
  hashPassword
};
