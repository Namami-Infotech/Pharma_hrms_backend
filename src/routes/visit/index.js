const express = require('express');
const router = express.Router();
const visitController = require('../../controllers/visit');

// POST /visit/mark_visit.php
router.post(['/mark_visit.php', '/mark_visit'], visitController.markVisit);

// GET & POST /visit/get_visits_entry.php
router.get(['/get_visits_entry.php', '/get_visits_entry'], visitController.getVisitsEntry);
router.post(['/get_visits_entry.php', '/get_visits_entry'], visitController.getVisitsEntry);

// GET & POST /visit/plan.php (and /get_planned_visits.php)
router.get(['/plan.php', '/plan', '/get_planned_visits.php', '/get_planned_visits'], visitController.getPlannedVisits);
router.post(['/plan.php', '/plan', '/get_planned_visits.php', '/get_planned_visits'], visitController.getPlannedVisits);

// GET & POST /visit/plan_visit.php (and /get_plan_visit_employee.php)
router.get(['/plan_visit.php', '/plan_visit', '/get_plan_visit_employee.php', '/get_plan_visit_employee'], visitController.getPlanVisitEmployee);
router.post(['/plan_visit.php', '/plan_visit', '/get_plan_visit_employee.php', '/get_plan_visit_employee'], visitController.getPlanVisitEmployee);

// GET & POST /visit/view_one_visit.php
router.get(['/view_one_visit.php', '/view_one_visit'], visitController.viewOneVisit);
router.post(['/view_one_visit.php', '/view_one_visit'], visitController.viewOneVisit);

// GET & POST /visit/view_visit.php
router.get(['/view_visit.php', '/view_visit'], visitController.viewVisit);
router.post(['/view_visit.php', '/view_visit'], visitController.viewVisit);

// GET & POST /visit/visits_entry.php (and /process_visits_entry.php)
router.get(['/visits_entry.php', '/visits_entry', '/process_visits_entry.php', '/process_visits_entry'], visitController.processVisitsEntry);
router.post(['/visits_entry.php', '/visits_entry', '/process_visits_entry.php', '/process_visits_entry'], visitController.processVisitsEntry);

module.exports = router;
