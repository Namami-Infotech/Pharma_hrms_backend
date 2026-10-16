const express = require('express');
const router = express.Router();
const policyController = require('../../controllers/policy');
const { uploadPolicyPDF } = require('../../middleware/upload');

// POST /policy/add_policy.php
router.post(['/add_policy.php', '/add_policy'], policyController.addPolicy);

// POST /policy/disable_policy.php
router.post(['/disable_policy.php', '/disable_policy'], policyController.disablePolicy);

// POST /policy/upload_policy.php
router.post(['/upload_policy.php', '/upload_policy'], (req, res, next) => {
  uploadPolicyPDF.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, policyController.uploadPolicy);

// GET & POST /policy/view_policy.php
router.get(['/view_policy.php', '/view_policy'], policyController.viewPolicy);
router.post(['/view_policy.php', '/view_policy'], policyController.viewPolicy);

module.exports = router;
