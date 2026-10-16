const markAttendance = require('./markAttendance');
const markAttendance1 = require('./markAttendance1');
const getMobileAttendance = require('./getMobileAttendance');
const markManualAttendance = require('./markManualAttendance');
const getRawAttendance = require('./getRawAttendance');
const getTodayAttendance = require('./getTodayAttendance');
const viewAttendance = require('./viewAttendance');
const processAttendance = require('./processAttendance');
const applyRegularise = require('./applyRegularise');
const getRegularise = require('./getRegularise');
const updateRegularise = require('./updateRegularise');
const correctActivity = require('./correctActivity');
const attendanceHelper = require('./attendanceHelper');

module.exports = {
  markAttendance,
  markAttendance1,
  getMobileAttendance,
  markManualAttendance,
  getRawAttendance,
  getTodayAttendance,
  viewAttendance,
  processAttendance,
  applyRegularise,
  getRegularise,
  updateRegularise,
  correctActivity,
  ...attendanceHelper
};
