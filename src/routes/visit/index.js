const express = require('express');
const router = express.Router();
const visitController = require('../../controllers/visit');

// 1. CREATE VISIT (Schedule / Plan a new visit)
router.post([
  '/create', '/create.php',
  '/create_visit', '/create_visit.php',
  '/plan', '/plan.php',
  '/plan_visit', '/plan_visit.php'
], visitController.createVisit);

// 2. UPDATE VISIT (Update date, status, remarks, or details)
router.post([
  '/update', '/update.php',
  '/update_visit', '/update_visit.php'
], visitController.updateVisit);
router.put(['/update', '/update_visit', '/:id'], visitController.updateVisit);

// 3. GET VISITS (Fetch visits list, filter by date, empId, role, status, or single visitId)
router.get([
  '/get', '/get.php',
  '/get_visits', '/get_visits.php',
  '/get_visit', '/get_visit.php',
  '/view_visit', '/view_visit.php',
  '/plan', '/plan.php',
  '/plan_visit', '/plan_visit.php',
  '/get_planned_visit', '/get_planned_visit.php',
  '/get_planned_visits', '/get_planned_visits.php',
  '/get_plan_visit', '/get_plan_visit.php',
  '/get_plan_visits', '/get_plan_visits.php',
  '/get_plan_visit_employee', '/get_plan_visit_employee.php'
], visitController.getVisits);

router.post([
  '/get', '/get.php',
  '/get_visits', '/get_visits.php',
  '/get_visit', '/get_visit.php',
  '/view_visit', '/view_visit.php',
  '/plan', '/plan.php',
  '/plan_visit', '/plan_visit.php',
  '/get_planned_visit', '/get_planned_visit.php',
  '/get_planned_visits', '/get_planned_visits.php',
  '/get_plan_visit', '/get_plan_visit.php',
  '/get_plan_visits', '/get_plan_visits.php',
  '/get_plan_visit_employee', '/get_plan_visit_employee.php'
], visitController.getVisits);

// 4. MARK VISIT (Visit complete kar liya / executed with GPS, photo, and remarks)
router.post(['/mark_visit', '/mark_visit.php'], visitController.markVisit);

// 5. VIEW SINGLE VISIT (Optional helper by ID)
router.get(['/view_one_visit', '/view_one_visit.php'], visitController.viewOneVisit);
router.post(['/view_one_visit', '/view_one_visit.php'], visitController.viewOneVisit);

module.exports = router;
