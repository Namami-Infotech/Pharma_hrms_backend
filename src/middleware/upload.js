const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Storage for employee profile pictures
const employeeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/employee');
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const empId = req.body.EmpId || 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `employee_${empId}_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const employeeFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.'));
  }
};

const uploadEmployeeImage = multer({
  storage: employeeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: employeeFileFilter
});

// Storage for policy PDFs
const policyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/policies');
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  }
});

const policyFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDFs are allowed.'));
  }
};

const uploadPolicyPDF = multer({
  storage: policyStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: policyFileFilter
});

module.exports = {
  uploadEmployeeImage,
  uploadPolicyPDF
};
