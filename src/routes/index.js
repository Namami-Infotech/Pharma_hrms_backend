const express = require('express');
const router = express.Router();

// Modular Route Folders
const authRoutes = require('./auth');
const attendanceRoutes = require('./attendance');
const employeeRoutes = require('./employee');
const leaveRoutes = require('./leave');
const assetRoutes = require('./asset');
const dealerRoutes = require('./dealer');
const expenseRoutes = require('./expense');
const travelRoutes = require('./travel');
const visitRoutes = require('./visit');
const salaryRoutes = require('./salary');
const taskRoutes = require('./task');
const holidayRoutes = require('./holiday');
const invoiceRoutes = require('./invoice');
const quotationRoutes = require('./quotation');
const productRoutes = require('./product');
const notificationRoutes = require('./notification');
const policyRoutes = require('./policy');
const supportRoutes = require('./support');
const trackRoutes = require('./track');
const dashboardRoutes = require('./dashboard');
const menuRoutes = require('./menu');
const miscRoutes = require('./misc');

// Create modular sub-router for all modules
const moduleRouter = express.Router();

moduleRouter.use('/auth', authRoutes);
moduleRouter.use('/attendance', attendanceRoutes);
moduleRouter.use('/employee', employeeRoutes);
moduleRouter.use('/leave', leaveRoutes);
moduleRouter.use('/assets', assetRoutes);
moduleRouter.use('/dealer', dealerRoutes);
moduleRouter.use('/expense', expenseRoutes);
moduleRouter.use('/travel', travelRoutes);
moduleRouter.use('/visit', visitRoutes);
moduleRouter.use('/salary', salaryRoutes);
moduleRouter.use('/task', taskRoutes);
moduleRouter.use('/holiday', holidayRoutes);
moduleRouter.use('/invoices', invoiceRoutes);
moduleRouter.use('/quotation', quotationRoutes);
moduleRouter.use('/product', productRoutes);
moduleRouter.use('/products', productRoutes);
moduleRouter.use('/notification', notificationRoutes);
moduleRouter.use('/policy', policyRoutes);
moduleRouter.use('/support', supportRoutes);
moduleRouter.use('/track', trackRoutes);
moduleRouter.use('/dashboard', dashboardRoutes);
moduleRouter.use('/menu', menuRoutes);
moduleRouter.use('/', miscRoutes);

// Mount under /src (file-based matching PHP) and / (clean URL)
router.use('/', moduleRouter);
router.use('/', moduleRouter);

module.exports = router;
