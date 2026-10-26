-- =============================================================
-- SAFEGUARD / pharma_hrms Database Schema
-- Complete MySQL Schema for All 32 Modules
-- =============================================================

CREATE DATABASE IF NOT EXISTS `pharma_hrms` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pharma_hrms`;

-- 0. Tenent Table
CREATE TABLE IF NOT EXISTS `Tenent` (
  `Tenent_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Id` INT DEFAULT 1,
  `Tenent_Name` VARCHAR(150) NOT NULL,
  `Menu` TEXT DEFAULT NULL,
  `IsActive` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS `Employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL UNIQUE,
  `Name` VARCHAR(150) NOT NULL,
  `EmailId` VARCHAR(150) NOT NULL,
  `Password` VARCHAR(255) NOT NULL,
  `Mobile` VARCHAR(20) DEFAULT NULL,
  `Role` VARCHAR(50) DEFAULT 'Employee',
  `Tenent_Id` INT DEFAULT 1,
  `Designation` VARCHAR(100) DEFAULT NULL,
  `Department` VARCHAR(100) DEFAULT NULL,
  `OfficeId` TEXT DEFAULT NULL,
  `DateOfJoining` DATE DEFAULT NULL,
  `DOB` DATE DEFAULT NULL,
  `FatherName` VARCHAR(150) DEFAULT NULL,
  `MotherName` VARCHAR(150) DEFAULT NULL,
  `PermanentAddress` TEXT DEFAULT NULL,
  `CurrentAddress` TEXT DEFAULT NULL,
  `EmergencyContact` VARCHAR(50) DEFAULT NULL,
  `BloodGroup` VARCHAR(10) DEFAULT NULL,
  `Gender` VARCHAR(20) DEFAULT NULL,
  `MaritalStatus` VARCHAR(20) DEFAULT NULL,
  `AadharNumber` VARCHAR(30) DEFAULT NULL,
  `PanNumber` VARCHAR(30) DEFAULT NULL,
  `AccountNumber` VARCHAR(50) DEFAULT NULL,
  `BankName` VARCHAR(100) DEFAULT NULL,
  `IfscCode` VARCHAR(30) DEFAULT NULL,
  `MobileId` VARCHAR(255) DEFAULT NULL,
  `fcm_token` TEXT DEFAULT NULL,
  `Image` TEXT DEFAULT NULL,
  `Pic` TEXT DEFAULT NULL,
  `OTP` VARCHAR(10) DEFAULT NULL,
  `OtpGeneratedAt` DATETIME DEFAULT NULL,
  `IsOTPExpired` TINYINT DEFAULT 0,
  `IsGeofence` TINYINT DEFAULT 0,
  `RM` VARCHAR(50) DEFAULT NULL,
  `Shift` VARCHAR(50) DEFAULT NULL,
  `ResetTime` VARCHAR(20) DEFAULT '06:00:00',
  `JoinDate` DATE DEFAULT NULL,
  `WeekOff` VARCHAR(50) DEFAULT NULL,
  `Grade` VARCHAR(50) DEFAULT NULL,
  `UAN` VARCHAR(50) DEFAULT NULL,
  `ESI` VARCHAR(50) DEFAULT NULL,
  `ProbationPeriod` VARCHAR(50) DEFAULT NULL,
  `IsActive` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`EmailId`),
  INDEX (`Tenent_Id`),
  INDEX (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EmployeeOffice Table
CREATE TABLE IF NOT EXISTS `EmployeeOffice` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `OfficeId` INT DEFAULT NULL,
  `OfficeName` VARCHAR(150) NOT NULL,
  `OfficeAddress` TEXT DEFAULT NULL,
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `LatLong` VARCHAR(100) DEFAULT '29.954646,78.074990',
  `Distance` INT DEFAULT 200,
  `Tenent_Id` INT DEFAULT 1,
  `IsActive` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. EmployeeLeave Table
CREATE TABLE IF NOT EXISTS `EmployeeLeave` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `LeaveType` VARCHAR(50) DEFAULT 'Annual',
  `TotalLeave` INT DEFAULT 0,
  `BalanceLeave` INT DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `FinancialYear` VARCHAR(20) DEFAULT NULL,
  `SL` DECIMAL(5,2) DEFAULT 0,
  `EL` DECIMAL(5,2) DEFAULT 0,
  `CompOff` DECIMAL(5,2) DEFAULT 0,
  `BL` DECIMAL(5,2) DEFAULT 0,
  `PL` DECIMAL(5,2) DEFAULT 0,
  `CL` DECIMAL(5,2) DEFAULT 0,
  INDEX (`EmpId`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS `Leaves` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `LeaveType` VARCHAR(50) NOT NULL,
  `StartDate` DATE NOT NULL,
  `EndDate` DATE NOT NULL,
  `TotalDays` INT DEFAULT 1,
  `Reason` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Remark` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `ApplyDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ApprovedDate` DATETIME DEFAULT NULL,
  INDEX (`EmpId`),
  INDEX (`Status`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Activity Table
CREATE TABLE IF NOT EXISTS `Activity` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Activity` VARCHAR(20) NOT NULL, -- 'In' or 'Out'
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `Distance` DECIMAL(10, 2) DEFAULT 0,
  `Address` TEXT DEFAULT NULL,
  `Image` LONGTEXT DEFAULT NULL,
  `Time` TIME NOT NULL,
  `Date` DATE NOT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `Remarks` TEXT DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Activity_New Table
CREATE TABLE IF NOT EXISTS `Activity_New` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Activity` VARCHAR(20) DEFAULT 'Attendance',
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `Distance` DECIMAL(10, 2) DEFAULT 0,
  `Address` TEXT DEFAULT NULL,
  `Image` LONGTEXT DEFAULT NULL,
  `Time` TIME DEFAULT NULL,
  `Date` DATE DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `Remarks` TEXT DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Attendance Table
CREATE TABLE IF NOT EXISTS `Attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Date` DATE DEFAULT NULL,
  `InTime` TIME DEFAULT NULL,
  `OutTime` TIME DEFAULT NULL,
  `TotalHours` VARCHAR(20) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Present',
  `InLatitude` DECIMAL(11, 8) DEFAULT NULL,
  `InLongitude` DECIMAL(11, 8) DEFAULT NULL,
  `InAddress` TEXT DEFAULT NULL,
  `InImage` LONGTEXT DEFAULT NULL,
  `OutLatitude` DECIMAL(11, 8) DEFAULT NULL,
  `OutLongitude` DECIMAL(11, 8) DEFAULT NULL,
  `OutAddress` TEXT DEFAULT NULL,
  `OutImage` LONGTEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `Remarks` TEXT DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Regularisation Table
CREATE TABLE IF NOT EXISTS `Regularisation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Date` DATE NOT NULL,
  `InTime` TIME DEFAULT NULL,
  `OutTime` TIME DEFAULT NULL,
  `Reason` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Remark` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `ApplyDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ApprovedDate` DATETIME DEFAULT NULL,
  INDEX (`EmpId`),
  INDEX (`Date`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Assets Table
CREATE TABLE IF NOT EXISTS `Assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `AssetId` VARCHAR(50) DEFAULT NULL,
  `AssetName` VARCHAR(150) NOT NULL,
  `AssetType` VARCHAR(100) DEFAULT NULL,
  `SerialNumber` VARCHAR(100) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Available',
  `Tenent_Id` INT DEFAULT 1,
  `Description` TEXT DEFAULT NULL,
  `PurchaseDate` DATE DEFAULT NULL,
  `WarrantyDate` DATE DEFAULT NULL,
  `Vendor` VARCHAR(150) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`AssetId`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Asset_Allocation Table
CREATE TABLE IF NOT EXISTS `Asset_Allocation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `AssetId` VARCHAR(50) NOT NULL,
  `EmpId` VARCHAR(50) NOT NULL,
  `AllocateDate` DATE DEFAULT NULL,
  `ReturnDate` DATE DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Allocated',
  `Condition` VARCHAR(100) DEFAULT NULL,
  `Remarks` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`AssetId`),
  INDEX (`EmpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Expenses Table
CREATE TABLE IF NOT EXISTS `Expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `ExpenseType` VARCHAR(100) NOT NULL,
  `Amount` DECIMAL(10, 2) NOT NULL,
  `BillDate` DATE DEFAULT NULL,
  `BillNumber` VARCHAR(100) DEFAULT NULL,
  `Attachment` TEXT DEFAULT NULL,
  `Remarks` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `ApplyDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Travel Table
CREATE TABLE IF NOT EXISTS `Travel` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `FromLocation` VARCHAR(150) NOT NULL,
  `ToLocation` VARCHAR(150) NOT NULL,
  `TravelDate` DATE NOT NULL,
  `ReturnDate` DATE DEFAULT NULL,
  `ModeOfTransport` VARCHAR(50) DEFAULT NULL,
  `Purpose` TEXT DEFAULT NULL,
  `EstimatedAmount` DECIMAL(10, 2) DEFAULT 0,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `ApplyDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Visits Table
CREATE TABLE IF NOT EXISTS `Visits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `ClientName` VARCHAR(150) NOT NULL,
  `ContactPerson` VARCHAR(150) DEFAULT NULL,
  `ContactNumber` VARCHAR(50) DEFAULT NULL,
  `Purpose` TEXT DEFAULT NULL,
  `VisitDate` DATE NOT NULL,
  `Status` VARCHAR(50) DEFAULT 'Completed',
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `Address` TEXT DEFAULT NULL,
  `Selfie` LONGTEXT DEFAULT NULL,
  `Signature` LONGTEXT DEFAULT NULL,
  `Remarks` TEXT DEFAULT NULL,
  `AlphabetCount` VARCHAR(10) DEFAULT 'A',
  `Tenent_Id` INT DEFAULT 1,
  `PlanVisitId` INT DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`VisitDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. VisitPlan Table
CREATE TABLE IF NOT EXISTS `VisitPlan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `ClientName` VARCHAR(150) NOT NULL,
  `ContactPerson` VARCHAR(150) DEFAULT NULL,
  `ContactNumber` VARCHAR(50) DEFAULT NULL,
  `PlannedDate` DATE NOT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `Remarks` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`PlannedDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Visits_Entry Table
CREATE TABLE IF NOT EXISTS `Visits_Entry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Date` DATE NOT NULL,
  `StartLatitude` DECIMAL(11, 8) DEFAULT NULL,
  `StartLongitude` DECIMAL(11, 8) DEFAULT NULL,
  `EndLatitude` DECIMAL(11, 8) DEFAULT NULL,
  `EndLongitude` DECIMAL(11, 8) DEFAULT NULL,
  `DistanceCovered` DECIMAL(10, 2) DEFAULT 0,
  `TotalVisits` INT DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Salary Table
CREATE TABLE IF NOT EXISTS `Salary` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Month` INT NOT NULL,
  `Year` INT NOT NULL,
  `Basic` DECIMAL(10, 2) DEFAULT 0,
  `HRA` DECIMAL(10, 2) DEFAULT 0,
  `Conveyance` DECIMAL(10, 2) DEFAULT 0,
  `SpecialAllowance` DECIMAL(10, 2) DEFAULT 0,
  `GrossSalary` DECIMAL(10, 2) DEFAULT 0,
  `PF` DECIMAL(10, 2) DEFAULT 0,
  `ESIC` DECIMAL(10, 2) DEFAULT 0,
  `TDS` DECIMAL(10, 2) DEFAULT 0,
  `TotalDeductions` DECIMAL(10, 2) DEFAULT 0,
  `NetSalary` DECIMAL(10, 2) DEFAULT 0,
  `WorkingDays` INT DEFAULT 30,
  `PresentDays` INT DEFAULT 0,
  `PaidDays` INT DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `GeneratedDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Month`, `Year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16a. Salary Structure New Table
CREATE TABLE IF NOT EXISTS `salary_structure_new` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empId` VARCHAR(50) NOT NULL,
  `emp_name` VARCHAR(150) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `grade` VARCHAR(50) DEFAULT NULL,
  `date_of_joining` VARCHAR(50) DEFAULT NULL,
  `basic_salary` DECIMAL(10, 2) DEFAULT 0,
  `basic_salary_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `hra` DECIMAL(10, 2) DEFAULT 0,
  `hra_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `conveyance` DECIMAL(10, 2) DEFAULT 0,
  `conveyance_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `special_allowance` DECIMAL(10, 2) DEFAULT 0,
  `special_allowance_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `gross_salary` DECIMAL(10, 2) DEFAULT 0,
  `gross_salary_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `epf` DECIMAL(10, 2) DEFAULT 0,
  `epf_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `esi` DECIMAL(10, 2) DEFAULT 0,
  `esi_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `total_benefits` DECIMAL(10, 2) DEFAULT 0,
  `total_benefits_per_annum` DECIMAL(10, 2) DEFAULT 0,
  `total_cost_of_company` DECIMAL(10, 2) DEFAULT 0,
  `net_take_home` DECIMAL(10, 2) DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_salary_empId` (`empId`),
  INDEX (`empId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16b. Salary Records Table
CREATE TABLE IF NOT EXISTS `salary_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Name` VARCHAR(150) DEFAULT NULL,
  `Designation` VARCHAR(100) DEFAULT NULL,
  `BasicSalary` DECIMAL(10, 2) DEFAULT 0,
  `Month` INT NOT NULL,
  `Year` INT NOT NULL,
  `TotalDaysInMonth` INT DEFAULT 30,
  `Holidays` INT DEFAULT 0,
  `WeekOffs` INT DEFAULT 0,
  `PresentDays` INT DEFAULT 0,
  `LeaveDays` INT DEFAULT 0,
  `ActualWorkingDays` INT DEFAULT 0,
  `Salary` DECIMAL(10, 2) DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Month`, `Year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16c. Salary Records New Table
CREATE TABLE IF NOT EXISTS `salary_records_new` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empId` VARCHAR(50) NOT NULL,
  `emp_name` VARCHAR(150) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `month` VARCHAR(20) NOT NULL,
  `year` INT NOT NULL,
  `total_days` INT DEFAULT 30,
  `present_days` INT DEFAULT 0,
  `leave_days` INT DEFAULT 0,
  `week_offs` INT DEFAULT 0,
  `holidays` INT DEFAULT 0,
  `working_days` INT DEFAULT 0,
  `basic_salary` DECIMAL(10, 2) DEFAULT 0,
  `hra` DECIMAL(10, 2) DEFAULT 0,
  `conveyance` DECIMAL(10, 2) DEFAULT 0,
  `special_allowance` DECIMAL(10, 2) DEFAULT 0,
  `gross_salary` DECIMAL(10, 2) DEFAULT 0,
  `epf` DECIMAL(10, 2) DEFAULT 0,
  `esi` DECIMAL(10, 2) DEFAULT 0,
  `total_deductions` DECIMAL(10, 2) DEFAULT 0,
  `net_salary` DECIMAL(10, 2) DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`empId`),
  INDEX (`month`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16d. Salary Structure Table
CREATE TABLE IF NOT EXISTS `salary_structure` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Basic_Salary` DECIMAL(10, 2) DEFAULT 0,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_ss_EmpId` (`EmpId`),
  INDEX (`EmpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tasks Table
CREATE TABLE IF NOT EXISTS `Tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `AssignedBy` VARCHAR(50) DEFAULT NULL,
  `Title` VARCHAR(255) NOT NULL,
  `Description` TEXT DEFAULT NULL,
  `Priority` VARCHAR(50) DEFAULT 'Medium',
  `DueDate` DATE DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `Remarks` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `CreatedDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Holidays Table
CREATE TABLE IF NOT EXISTS `Holidays` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`date`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Invoices Table
CREATE TABLE IF NOT EXISTS `Invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` VARCHAR(100) DEFAULT NULL,
  `invoice_date` DATE NOT NULL,
  `client_name` VARCHAR(150) DEFAULT NULL,
  `amount` DECIMAL(10, 2) DEFAULT 0,
  `gst_amount` DECIMAL(10, 2) DEFAULT 0,
  `total_amount` DECIMAL(10, 2) DEFAULT 0,
  `utr_no` VARCHAR(100) DEFAULT NULL,
  `invoice_status` VARCHAR(50) DEFAULT 'Unpaid',
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_date_time` DATETIME DEFAULT NULL,
  INDEX (`invoice_date`),
  INDEX (`invoice_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Notifications Table
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `url` TEXT DEFAULT NULL,
  `push_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `image` TEXT DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. OrganizationPolicy Table
CREATE TABLE IF NOT EXISTS `OrganizationPolicy` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `PolicyName` VARCHAR(255) NOT NULL,
  `PolicyDescription` TEXT DEFAULT NULL,
  `PolicyPDF` LONGTEXT DEFAULT NULL,
  `IsActive` TINYINT DEFAULT 1,
  `Tenent_Id` INT DEFAULT 1,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`Tenent_Id`),
  INDEX (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Support_Tickets Table
CREATE TABLE IF NOT EXISTS `Support_Tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Cat` VARCHAR(100) NOT NULL,
  `SubCat` VARCHAR(100) NOT NULL,
  `Remark` TEXT NOT NULL,
  `Image` LONGTEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Open',
  `Date` DATE NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. LiveTracking Table
CREATE TABLE IF NOT EXISTS `LiveTracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batchId` VARCHAR(100) NOT NULL,
  `emp_id` VARCHAR(50) NOT NULL,
  `latitude` DECIMAL(11, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `Address` TEXT DEFAULT NULL,
  `device_time` DATETIME NOT NULL,
  `server_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `gps_status` VARCHAR(50) DEFAULT NULL,
  INDEX (`emp_id`),
  INDEX (`batchId`),
  INDEX (`server_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Menu Table
CREATE TABLE IF NOT EXISTS `Menu` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `SameMenuId` INT DEFAULT NULL,
  `Cat` VARCHAR(100) DEFAULT NULL,
  `Sub` VARCHAR(100) DEFAULT NULL,
  `Caption` VARCHAR(150) DEFAULT NULL,
  `CheckpointId` INT DEFAULT NULL,
  `Active` TINYINT DEFAULT 1,
  `Icons` VARCHAR(255) DEFAULT NULL,
  `Verifier` VARCHAR(100) DEFAULT NULL,
  `Approver` VARCHAR(100) DEFAULT NULL,
  `Verifier_Role` VARCHAR(100) DEFAULT NULL,
  `Approver_Role` VARCHAR(100) DEFAULT NULL,
  INDEX (`SameMenuId`),
  INDEX (`Active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Checkpoints Table
CREATE TABLE IF NOT EXISTS `Checkpoints` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Description` TEXT DEFAULT NULL,
  `Value` TEXT DEFAULT NULL,
  `Options` TEXT DEFAULT NULL,
  `TypeId` INT NOT NULL,
  `Mandatory` TINYINT DEFAULT 0,
  `Editable` TINYINT DEFAULT 1,
  `Correct` TEXT DEFAULT NULL,
  `Size` VARCHAR(50) DEFAULT '',
  `Score` INT DEFAULT 0,
  `Validation` VARCHAR(255) DEFAULT NULL,
  `Language` INT DEFAULT 1,
  `Active` TINYINT DEFAULT 1,
  `Dependent` TINYINT DEFAULT 0,
  `Logic` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Type Table
CREATE TABLE IF NOT EXISTS `Type` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Description` VARCHAR(255) NOT NULL,
  `Size` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. TypeExt Table
CREATE TABLE IF NOT EXISTS `TypeExt` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Description` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. TransactionHDR Table
CREATE TABLE IF NOT EXISTS `TransactionHDR` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `MenuId` INT NOT NULL,
  `ActivityId` VARCHAR(100) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`MenuId`),
  INDEX (`ActivityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. TransactionDTL Table
CREATE TABLE IF NOT EXISTS `TransactionDTL` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `ActivityId` VARCHAR(100) NOT NULL,
  `ChkId` INT NOT NULL,
  `Value` TEXT DEFAULT NULL,
  `LatLong` VARCHAR(100) DEFAULT NULL,
  `DateTime` DATETIME DEFAULT NULL,
  INDEX (`ActivityId`),
  INDEX (`ChkId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. Devices Table
CREATE TABLE IF NOT EXISTS `Devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `DeviceId` VARCHAR(255) NOT NULL,
  `DeviceName` VARCHAR(255) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Active',
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`DeviceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. Devices_Audit Table
CREATE TABLE IF NOT EXISTS `Devices_Audit` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `DeviceId` VARCHAR(255) NOT NULL,
  `Action` VARCHAR(50) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. Demo Table
CREATE TABLE IF NOT EXISTS `Demo` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(150) NOT NULL,
  `Email` VARCHAR(150) NOT NULL,
  `PhoneNumber` VARCHAR(50) NOT NULL,
  `CompanyName` VARCHAR(150) NOT NULL,
  `CompanySize` VARCHAR(50) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. Activity Table
CREATE TABLE IF NOT EXISTS `Activity` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Activity` VARCHAR(20) DEFAULT NULL,
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `Distance` DECIMAL(10, 2) DEFAULT 0.00,
  `Address` TEXT DEFAULT NULL,
  `Image` LONGTEXT DEFAULT NULL,
  `Time` TIME DEFAULT NULL,
  `Date` DATE DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `Remarks` TEXT DEFAULT NULL,
  `LocationId` VARCHAR(100) DEFAULT NULL,
  `Event` VARCHAR(50) DEFAULT NULL,
  `GeoLocation` VARCHAR(100) DEFAULT NULL,
  `MobileDateTime` DATETIME DEFAULT NULL,
  `ServerDateTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `app_ver` VARCHAR(50) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34. Activity_New Table
CREATE TABLE IF NOT EXISTS `Activity_New` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `Activity` VARCHAR(20) DEFAULT NULL,
  `Latitude` DECIMAL(11, 8) DEFAULT NULL,
  `Longitude` DECIMAL(11, 8) DEFAULT NULL,
  `Distance` DECIMAL(10, 2) DEFAULT 0.00,
  `Address` TEXT DEFAULT NULL,
  `Image` LONGTEXT DEFAULT NULL,
  `Time` TIME DEFAULT NULL,
  `Date` DATE DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `Remarks` TEXT DEFAULT NULL,
  `LocationId` VARCHAR(100) DEFAULT NULL,
  `Event` VARCHAR(50) DEFAULT NULL,
  `GeoLocation` VARCHAR(100) DEFAULT NULL,
  `MobileDateTime` DATETIME DEFAULT NULL,
  `ServerDateTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `app_ver` VARCHAR(50) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`Date`),
  INDEX (`Tenent_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 35. Assets Issue Table
CREATE TABLE IF NOT EXISTS `assets_issue` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_id` VARCHAR(50) NOT NULL,
  `asset_id` INT NOT NULL,
  `asset_name` VARCHAR(150) DEFAULT NULL,
  `serial_number` VARCHAR(100) DEFAULT NULL,
  `make_name` VARCHAR(100) DEFAULT NULL,
  `model_name` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Issued',
  `remark` TEXT DEFAULT NULL,
  `issue_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `return_date` DATETIME DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`emp_id`),
  INDEX (`asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 36. Dealers Table
CREATE TABLE IF NOT EXISTS `Dealers` (
  `DealerID` INT AUTO_INCREMENT PRIMARY KEY,
  `DealerName` VARCHAR(150) NOT NULL,
  `Address` TEXT DEFAULT NULL,
  `ContactInfo` VARCHAR(100) DEFAULT NULL,
  `LatLong` VARCHAR(100) DEFAULT NULL,
  `CompanyName` VARCHAR(150) DEFAULT NULL,
  `MailId` VARCHAR(150) DEFAULT NULL,
  `Remarks` TEXT DEFAULT NULL,
  `AddedByEmpId` VARCHAR(50) DEFAULT NULL,
  `IsActive` TINYINT DEFAULT 1,
  `Tenent_Id` INT DEFAULT 1,
  `CreateDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`DealerName`),
  INDEX (`AddedByEmpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 37. ExpenseDetails Table
CREATE TABLE IF NOT EXISTS `ExpenseDetails` (
  `detailId` INT AUTO_INCREMENT PRIMARY KEY,
  `batchId` VARCHAR(100) NOT NULL,
  `empId` VARCHAR(50) NOT NULL,
  `expenseDate` DATE NOT NULL,
  `expenseType` VARCHAR(100) NOT NULL,
  `expenseAmount` DECIMAL(12, 2) NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Pending',
  `Remarks` TEXT DEFAULT NULL,
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`empId`),
  INDEX (`batchId`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 38. TravelExpenses Table
CREATE TABLE IF NOT EXISTS `TravelExpenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batchId` VARCHAR(100) NOT NULL,
  `empId` VARCHAR(50) NOT NULL,
  `travelDate` DATE NOT NULL,
  `travelFrom` VARCHAR(150) NOT NULL,
  `travelTo` VARCHAR(150) NOT NULL,
  `travelType` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `remark` TEXT DEFAULT NULL,
  `ApprovedBy` VARCHAR(50) DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`empId`),
  INDEX (`batchId`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 39. Visit Table
CREATE TABLE IF NOT EXISTS `Visit` (
  `VisitID` INT AUTO_INCREMENT PRIMARY KEY,
  `EmpId` VARCHAR(50) NOT NULL,
  `DealerID` INT DEFAULT NULL,
  `DealerName` VARCHAR(150) DEFAULT NULL,
  `VisitCount` VARCHAR(10) DEFAULT 'A',
  `VisitLatLong` VARCHAR(100) DEFAULT NULL,
  `VisitTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `Status` VARCHAR(50) DEFAULT 'Planned',
  `Plan_Visit` DATETIME DEFAULT NULL,
  `CompanyName` VARCHAR(150) DEFAULT NULL,
  `MobileNo` VARCHAR(20) DEFAULT NULL,
  `Mode` VARCHAR(50) DEFAULT NULL,
  `Purpose` VARCHAR(255) DEFAULT NULL,
  `Remarks` TEXT DEFAULT NULL,
  `Attachment` VARCHAR(255) DEFAULT NULL,
  `old_visit` INT DEFAULT NULL,
  `LatLong` VARCHAR(100) DEFAULT NULL,
  `Tenent_Id` INT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`EmpId`),
  INDEX (`DealerID`),
  INDEX (`Plan_Visit`),
  INDEX (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

