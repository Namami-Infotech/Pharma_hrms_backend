const login = require('./login');
const newLogin = require('./newLogin');
const verifyOtp = require('./verifyOtp');
const manageDevices = require('./manageDevices');
const changePassword = require('./changePassword');
const forgetPassword = require('./forgetPassword');
const getOfficeDetails = require('./getOfficeDetails');
const getMenuByTenent = require('./getMenuByTenent');
const authHelper = require('./authHelper');

module.exports = {
  login,
  newLogin,
  verifyOtp,
  manageDevices,
  changePassword,
  forgetPassword,
  getOfficeDetails,
  getMenuByTenent,
  ...authHelper
};
