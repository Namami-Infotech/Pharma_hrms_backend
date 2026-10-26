const express = require('express');
const router = express.Router();
const quotationController = require('../../controllers/quotation');

// Settings (Threshold configuration)
router.get(['/settings.php', '/settings'], quotationController.getQuotationSettings);
router.post(['/settings.php', '/settings'], quotationController.updateQuotationSettings);

// Approve Quotation (Status -> Sent & Dispatch Email)
router.post(['/approve_quotation.php', '/approve_quotation', '/approve/:id', '/approve'], quotationController.approveQuotation);

// GET & POST /quotation/list_quotations.php (and /get_quotations.php, /)
router.get(['/list_quotations.php', '/list_quotations', '/get_quotations.php', '/get_quotations', '/'], quotationController.getQuotations);
router.post(['/list_quotations.php', '/list_quotations', '/get_quotations.php', '/get_quotations', '/list'], quotationController.getQuotations);

// GET & POST /quotation/view_quotation.php (and /:id)
router.get(['/view_quotation.php', '/view_quotation', '/:id'], quotationController.getQuotationById);
router.post(['/view_quotation.php', '/view_quotation'], quotationController.getQuotationById);

// POST /quotation/create_quotation.php (and /create)
router.post(['/create_quotation.php', '/create_quotation', '/create', '/add'], quotationController.createQuotation);

// POST /quotation/update_quotation.php (and /update/:id)
router.post(['/update_quotation.php', '/update_quotation', '/update/:id', '/update'], quotationController.updateQuotation);

// POST /quotation/delete_quotation.php (and /delete/:id)
router.post(['/delete_quotation.php', '/delete_quotation', '/delete/:id', '/delete'], quotationController.deleteQuotation);
router.delete(['/:id', '/delete/:id'], quotationController.deleteQuotation);

module.exports = router;
