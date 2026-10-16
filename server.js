const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const apiRoutes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/employee'),
  path.join(__dirname, 'uploads/attendance'),
  path.join(__dirname, 'assets')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsers (increased limit for base64 images and PDFs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static assets & uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/employee/uploads', express.static(path.join(__dirname, 'uploads/employee')));
app.use('/src/employee/uploads', express.static(path.join(__dirname, 'uploads/employee')));
app.use('/attendance/uploads', express.static(path.join(__dirname, 'uploads/attendance')));
app.use('/src/attendance/uploads', express.static(path.join(__dirname, 'uploads/attendance')));

// Health check / Welcome
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SAFEGUARD Node.js Express Backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root index redirect
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SAFEGUARD API Server is running',
    version: '1.0.0'
  });
});

// URL Normalizer: Strips legacy /SAFEGUARD prefix and .php extension if needed
app.use((req, res, next) => {
  if (req.url.startsWith('/SAFEGUARD')) {
    req.url = req.url.replace(/^\/SAFEGUARD/, '') || '/';
  }
  if (req.url.includes('.php')) {
    req.url = req.url.replace(/\.php(\?|$)/, '$1');
  }
  next();
});

// Mount clean API routes (/api and root /)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Centralized error handler
app.use(errorHandler);

const { seedDatabase } = require('./src/config/seed');

// Start server
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(` SAFEGUARD Backend running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database: ${(process.env.DB_NAME || 'pharma_hrms').trim()}`);
    console.log('====================================================');

    // Automatically seed/verify initial database values on startup
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.error('[Startup] Error during database seeding:', seedErr);
    }
  });
}

module.exports = app;
