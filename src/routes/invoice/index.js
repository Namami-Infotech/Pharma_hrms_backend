const express = require('express');
const router = express.Router();
const invoiceController = require('../../controllers/invoice');

// GET & POST /invoices/get_invoices.php
router.get(['/get_invoices.php', '/get_invoices'], invoiceController.getInvoices);
router.post(['/get_invoices.php', '/get_invoices'], invoiceController.getInvoices);

// POST /invoices/update_invoice.php
router.post(['/update_invoice.php', '/update_invoice'], invoiceController.updateInvoice);

module.exports = router;
