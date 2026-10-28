const db = require('../../config/db');
const { getOfficeDetails, getMenuByTenent, getActiveRoleModules } = require('./authHelper');

// 3. OTP Validation (src/auth/otp.php)
const verifyOtp = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const otpInput = (data.otp || '').toString().trim();
  const mobileId = data.mobileId || '';
  const fcmToken = data.fcm_token || '';

  if (!otpInput) {
    response.message = 'OTP is required.';
    return res.json(response);
  }

  try {
    let employee = null;
    let isTestUser = false;

    // Handle test user with 123456
    if (otpInput === '123456') {
      const [testRows] = await db.query(
        'SELECT * FROM Employees WHERE EmpId = ? OR Mobile = ? OR EmailId = ? LIMIT 1',
        ['8888888888', '8888888888', 'namamiinfotech2024@gmail.com']
      );
      if (testRows && testRows.length > 0) {
        employee = testRows[0];
        isTestUser = true;
      }
    }

    if (isTestUser && employee) {
      // Update FCM and mobileId
      if (mobileId || fcmToken) {
        await db.execute(
          'UPDATE Employees SET MobileId = ?, FCM_Token = ? WHERE EmpId = ?',
          [mobileId, fcmToken, employee.EmpId]
        );
      }

      const officeDetails = await getOfficeDetails(employee.EmpId);
      const menu = await getMenuByTenent(employee.Tenent_Id);
      const { moduleIds, moduleList, modulesDetail } = await getActiveRoleModules();

      response.success = true;
      response.message = 'Login successful (Test User)';
      response.data = {
        emp_id: employee.EmpId,
        image: employee.Pic,
        username: employee.Name,
        email: employee.EmailId,
        role: employee.Role,
        rm: employee.RM,
        designation: employee.Designation,
        shift: employee.Shift,
        ResetTime: employee.ResetTime || '06:00:00',
        tenent_id: employee.Tenent_Id,
        office_details: officeDetails.data,
        regularise: '30',
        modules: moduleIds,
        attendanceStatus: '1',
        faceAttendance: '0',
        mobileId,
        fcm_token: fcmToken
      };

      return res.json(response);
    }

    // Regular user OTP validation
    const [otpRows] = await db.query(
      'SELECT * FROM Employees WHERE OTP = ? LIMIT 1',
      [otpInput]
    );

    if (!otpRows || otpRows.length === 0) {
      response.message = 'Invalid OTP.';
      return res.json(response);
    }

    employee = otpRows[0];
    const now = Date.now();
    const otpTime = employee.OtpGeneratedAt ? new Date(employee.OtpGeneratedAt).getTime() : now;
    const diffMinutes = Math.abs(now - otpTime) / (60 * 1000);

    // 5 minutes validity (with small buffer for network/clock differences)
    if (diffMinutes <= 10) {
      if (mobileId || fcmToken) {
        await db.execute(
          'UPDATE Employees SET MobileId = ?, FCM_Token = ? WHERE EmpId = ?',
          [mobileId, fcmToken, employee.EmpId]
        );
      }

      const officeDetails = await getOfficeDetails(employee.EmpId);
      const menu = await getMenuByTenent(employee.Tenent_Id);
      const { moduleIds, moduleList, modulesDetail } = await getActiveRoleModules();

      response.success = true;
      response.message = 'Login successful';
      response.data = {
        emp_id: employee.EmpId,
        image: employee.Pic || employee.Image,
        username: employee.Name,
        email: employee.EmailId,
        role: employee.Role,
        rm: employee.RM,
        designation: employee.Designation,
        shift: employee.Shift,
        ResetTime: employee.ResetTime || '06:00:00',
        regularise: '30',
        tenent_id: employee.Tenent_Id,
        office_details: officeDetails.data,
        modules: moduleIds,
        attendanceStatus: '1',
        faceAttendance: '0',
        mobileId,
        fcm_token: fcmToken
      };

      // Clear OTP safely
      try {
        await db.execute(
          'UPDATE Employees SET OTP = NULL, OtpGeneratedAt = NULL WHERE EmpId = ?',
          [employee.EmpId]
        );
      } catch (clearErr) {
        await db.execute(
          'UPDATE Employees SET OTP = NULL WHERE EmpId = ?',
          [employee.EmpId]
        );
      }
    } else {
      response.message = 'The OTP has expired. Please request a new one.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in verifyOtp:', err);
    response.message = 'An error occurred while verifying OTP.';
    return res.status(500).json(response);
  }
};

module.exports = verifyOtp;
