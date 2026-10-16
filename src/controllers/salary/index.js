const addSalary = require('./addSalary');
const calculateSalary = require('./calculateSalary');
const getSalary = require('./getSalary');
const getSalaryRecords = require('./getSalaryRecords');
const getSalarySlip = require('./getSalarySlip');
const { calculateWeeklyOffs } = require('./salaryHelper');

module.exports = {
  addSalary,
  calculateSalary,
  getSalary,
  getSalaryRecords,
  getSalarySlip,
  calculateWeeklyOffs
};
