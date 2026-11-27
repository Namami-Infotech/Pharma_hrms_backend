const express = require('express');
const router = express.Router();

const { getDoctorSpeciality } = require('../../controllers/specialist');

// Support GET and POST, and both clean URL and .php extension
router.get(['/getDoctorSpeciality', '/getDoctorSpeciality.php'], getDoctorSpeciality);
router.post(['/getDoctorSpeciality', '/getDoctorSpeciality.php'], getDoctorSpeciality);

module.exports = router;
