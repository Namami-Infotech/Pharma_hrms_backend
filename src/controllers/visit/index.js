const createVisit = require('./createVisit');
const updateVisit = require('./updateVisit');
const getVisits = require('./getVisits');
const markVisit = require('./markVisit');
const viewOneVisit = require('./viewOneVisit');
const viewVisit = require('./viewVisit');
const getPlannedVisits = require('./getPlannedVisits');
const getPlanVisitEmployee = require('./getPlanVisitEmployee');
const getVisitsEntry = require('./getVisitsEntry');
const processVisitsEntry = require('./processVisitsEntry');
const { getDrivingDistance } = require('./visitHelper');

module.exports = {
  createVisit,
  updateVisit,
  getVisits,
  markVisit,
  viewOneVisit,
  viewVisit,
  getPlannedVisits,
  getPlanVisitEmployee,
  getVisitsEntry,
  processVisitsEntry,
  getDrivingDistance
};
