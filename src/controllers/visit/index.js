const markVisit = require('./markVisit');
const getVisitsEntry = require('./getVisitsEntry');
const getPlannedVisits = require('./getPlannedVisits');
const getPlanVisitEmployee = require('./getPlanVisitEmployee');
const viewOneVisit = require('./viewOneVisit');
const viewVisit = require('./viewVisit');
const processVisitsEntry = require('./processVisitsEntry');
const { getDrivingDistance } = require('./visitHelper');

module.exports = {
  markVisit,
  getVisitsEntry,
  getPlannedVisits,
  getPlanVisitEmployee,
  viewOneVisit,
  viewVisit,
  processVisitsEntry,
  getDrivingDistance
};
