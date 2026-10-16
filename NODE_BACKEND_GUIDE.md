# SAFEGUARD Backend Migration (PHP -> Node.js + Express.js)

The backend of the **SAFEGUARD** project has been migrated from PHP to a scalable, robust **Node.js + Express.js** architecture, connecting to the existing **MySQL** database (`SAFEGUARD`).

---

## 1. Quick Start Guide

### Step 1: Install Dependencies
Dependencies have already been installed. If running in a new environment, run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Verify or edit `.env` in the root folder with your database credentials:
```ini
PORT=3000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=zsxdfgh
DB_PASS=werty
DB_NAME=SAFEGUARD

# SMTP Email Configuration
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=communications@namami-infotech.com
SMTP_PASS=developer@1234
SMTP_FROM="Namami-Infotech" <communications@namami-infotech.com>

# Firebase Push Notification (FCM)
FIREBASE_SERVICE_ACCOUNT=src/notification/hr-smile-firebase-adminsdk-josms-77f906f003.json

# Public Base URL
BASE_URL=http://localhost:3000
```

### Step 3: Run the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```
- **Verify API health**:
  ```bash
  npm test
  ```

---

## 2. Architecture & Directory Structure

```
SAFEGUARD/
??? config/
?   ??? db.js                      # MySQL2 connection pool with IST timezone
?   ??? mailer.js                  # Nodemailer GoDaddy SMTP transport
?   ??? fcm.js                     # Google OAuth2 + FCM v1 Push API client
??? middleware/
?   ??? upload.js                  # Multer disk storage for photos & PDFs
?   ??? errorHandler.js            # Centralized JSON error response handler
??? controllers/
?   ??? authController.js          # Login, OTP, Passwords, Devices, Tenent Menu
?   ??? attendanceController.js    # In/Out attendance, Geofencing, Regularisation
?   ??? employeeController.js      # Add/Edit/List/View/Disable employees & offices
?   ??? leaveController.js         # Apply leave, balances, approval, CompOff, PL
?   ??? assetController.js         # Add, view, issue, update company assets
?   ??? dealerController.js        # Add dealer, fetch dynamic checkpoint dealers
?   ??? expenseController.js       # Apply and update expense claims
?   ??? travelController.js        # Apply travel, travel status
?   ??? visitController.js         # Mark visit (A, B, C counts), view, process
?   ??? salaryController.js        # Add, calculate, view salary slips
?   ??? taskController.js          # Get tasks, complete/action tasks
?   ??? holidayController.js       # Add, edit, list holidays by financial year
?   ??? invoiceController.js       # View current FY invoices, update UTR status
?   ??? notificationController.js  # Add notification & push FCM to tenant devices
?   ??? policyController.js        # Add, disable, upload PDF, view policies
?   ??? supportController.js       # Raise & view support tickets (HR / Employee)
?   ??? trackController.js         # Live GPS location batch insert & reverse geocode
?   ??? dashboardController.js     # Active employee summary count
?   ??? menuController.js          # Dynamic forms, Checkpoints, Menu, Transactions
?   ??? miscController.js          # Birthday automated mailer, Demo request form
??? routes/
?   ??? apiRoutes.js               # Dual-scheme universal router (.php & clean URLs)
??? uploads/                       # Policy PDFs
??? src/employee/uploads/          # Employee profile photos
??? .env                           # Environment configuration
??? server.js                      # Express application entrypoint
```

---

## 3. 100% Frontend Compatibility

The Node.js server supports both **legacy PHP paths** and **clean REST paths** across multiple URL conventions:
- `/src/auth/login.php` AND `/src/auth/login`
- `/SAFEGUARD/src/auth/login.php` AND `/SAFEGUARD/src/auth/login`
- `/auth/login.php` AND `/auth/login`

All response JSON structures (`{ success, message, data }`), HTTP status codes, and database schema mappings remain identical.

---

## 4. Key Endpoints Reference (Clean REST Routes)

| Module | HTTP Method | Clean REST Endpoint | Node.js Controller Action |
| :--- | :--- | :--- | :--- |
| **Auth** | POST | `/auth/login` | `authController.login` |
| **Auth** | POST | `/auth/new_login` | `authController.newLogin` |
| **Auth** | POST | `/auth/verify_otp` | `authController.verifyOtp` |
| **Auth** | POST | `/auth/manage_devices` | `authController.manageDevices` |
| **Auth** | POST | `/auth/change_password` | `authController.changePassword` |
| **Attendance** | POST | `/attendance/mark_attendance` | `attendanceController.markAttendance` |
| **Attendance** | GET/POST | `/attendance/get_mobile_attendance` | `attendanceController.getMobileAttendance` |
| **Attendance** | GET/POST | `/attendance/view_attendance` | `attendanceController.viewAttendance` |
| **Employee** | POST | `/employee/add_employee` | `employeeController.addEmployee` |
| **Employee** | GET/POST | `/employee/list_employees` | `employeeController.listEmployees` |
| **Leave** | POST | `/leave/apply_leave` | `leaveController.applyLeave` |
| **Leave** | GET/POST | `/leave/get_balance_leave` | `leaveController.getBalanceLeave` |
| **Asset** | POST | `/assets/add_asset` | `assetController.addAsset` |
| **Dealer** | POST | `/dealer/add_dealer` | `dealerController.addDealer` |
| **Dealer** | GET/POST | `/dealer/get_dealers` | `dealerController.getDealers` |
| **Expense** | POST | `/expense/apply_expense` | `expenseController.applyExpense` |
| **Travel** | POST | `/travel/apply_travel` | `travelController.applyTravel` |
| **Visit** | POST | `/visit/mark_visit` | `visitController.markVisit` |
| **Salary** | POST | `/salary/calculate_salary` | `salaryController.calculateSalary` |
| **Salary** | GET/POST | `/salary/get_salary_slip` | `salaryController.getSalarySlip` |
| **Task** | GET/POST | `/task/get_task` | `taskController.getTask` |
| **Holiday** | GET/POST | `/holiday/view_holiday` | `holidayController.viewHoliday` |
| **Invoices** | GET/POST | `/invoices/get_invoices` | `invoiceController.getInvoices` |
| **Notification** | POST | `/notification/add_notification` | `notificationController.addNotification` |
| **Policy** | POST | `/policy/add_policy` | `policyController.addPolicy` |
| **Policy** | POST | `/policy/upload_policy` | `policyController.uploadPolicy` |
| **Support** | POST | `/support/get_support` | `supportController.getSupport` |
| **Tracking** | POST | `/track/add_location` | `trackController.addLocation` |
| **Tracking** | GET | `/track/address` | `trackController.getAddress` |
| **Dashboard** | GET | `/dashboard/dashboard` | `dashboardController.getDashboard` |
| **Menu** | POST | `/menu/add_transaction` | `menuController.addTransaction` |
| **Menu** | GET | `/menu/get_menu` | `menuController.getMenu` |
