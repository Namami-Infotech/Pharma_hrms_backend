const db = require('../../config/db');
const { hashPassword } = require('./employeeHelper');

const addEmployee = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = (data.EmpId || '').toString().trim();
  const Name = (data.Name || '').toString().trim();
  const Password = (data.Password || '').toString();
  const Shift = (data.Shift || '').toString().trim();
  const offices = data.Offices || [];
  const Mobile = data.Mobile || '';
  const EmailId = data.EmailId || '';
  const Role = data.Role || '';
  const OTP = data.OTP || null;
  const IsOTPExpired = data.IsOTPExpired || 0;
  const IsGeofence = data.IsGeofence || 0;
  const Tenent_Id = data.Tenent_Id || null;
  const IsActive = data.IsActive !== undefined ? data.IsActive : 1;
  const CreateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const RM = data.RM || null;
  const ResetTime = data.ResetTime || '06:00:00';
  const JoinDate = data.JoinDate || '';
  const DOB = data.DOB || '';
  const WeekOff = data.WeekOff || null;
  const Designation = data.Designation || null;
  const Grade = data.Grade || null;
  const UAN = data.UAN || null;
  const ESI = data.ESI || null;
  const ProbationPeriod = data.ProbationPeriod || null;

  if (!EmpId || !Name || !Password || !Shift || !Array.isArray(offices) || offices.length === 0) {
    const missing = [];
    if (!EmpId) missing.push('EmpId');
    if (!Name) missing.push('Name');
    if (!Password) missing.push('Password');
    if (!Shift) missing.push('Shift');
    if (!offices || offices.length === 0) missing.push('Offices');
    response.message = 'Missing required field(s): ' + missing.join(', ');
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    const [existRows] = await conn.query(
      'SELECT COUNT(*) as count FROM Employees WHERE EmpId = ?',
      [EmpId]
    );

    if (existRows[0].count > 0) {
      conn.release();
      response.message = 'Employee ID already exists. Please use a different ID.';
      return res.json(response);
    }

    await conn.beginTransaction();

    // Map offices
    const officeIds = [];
    for (const office of offices) {
      const officeName = (office.OfficeName || '').trim();
      const latLong = (office.LatLong || '').trim();

      // 1. Try exact OfficeName and LatLong match
      let [offRows] = await conn.query(
        'SELECT id, OfficeId FROM EmployeeOffice WHERE OfficeName = ? AND LatLong = ? LIMIT 1',
        [officeName, latLong]
      );

      // 2. Fallback: match by OfficeName alone (case-insensitive)
      if (!offRows || offRows.length === 0) {
        [offRows] = await conn.query(
          'SELECT id, OfficeId FROM EmployeeOffice WHERE TRIM(LOWER(OfficeName)) = TRIM(LOWER(?)) LIMIT 1',
          [officeName]
        );
      }

      // 3. Fallback: match by proximity or numeric LatLong coordinates if provided
      if ((!offRows || offRows.length === 0) && latLong) {
        const parts = latLong.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            [offRows] = await conn.query(
              'SELECT id, OfficeId FROM EmployeeOffice WHERE ABS(Latitude - ?) < 0.001 AND ABS(Longitude - ?) < 0.001 LIMIT 1',
              [lat, lon]
            );
          }
        }
      }

      // 4. Fallback: match by id or OfficeId if provided in object
      if ((!offRows || offRows.length === 0) && (office.Id || office.OfficeId || office.id)) {
        const targetId = office.Id || office.OfficeId || office.id;
        [offRows] = await conn.query(
          'SELECT id, OfficeId FROM EmployeeOffice WHERE id = ? OR OfficeId = ? LIMIT 1',
          [targetId, targetId]
        );
      }

      if (!offRows || offRows.length === 0) {
        throw new Error(`Office not found: ${officeName || 'Unnamed'}`);
      }

      const matchedId = offRows[0].id || offRows[0].OfficeId || offRows[0].Id;
      officeIds.push(matchedId);
    }

    const assignedOfficeId = officeIds.join(',');
    const hashedPassword = hashPassword(Password);

    const insertSql = `
      INSERT INTO Employees 
      (EmpId, Name, Password, Mobile, EmailId, Role, OTP, IsOTPExpired, IsGeofence, Tenent_Id, IsActive, CreateDate, RM, Shift, ResetTime, DOB, JoinDate, OfficeId, WeekOff, Designation, Grade, UAN, ESI, ProbationPeriod) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertSql, [
      EmpId,
      Name,
      hashedPassword,
      Mobile,
      EmailId,
      Role,
      OTP,
      IsOTPExpired,
      IsGeofence,
      Tenent_Id,
      IsActive,
      CreateDate,
      RM,
      Shift,
      ResetTime,
      DOB,
      JoinDate,
      assignedOfficeId,
      WeekOff,
      Designation,
      Grade,
      UAN,
      ESI,
      ProbationPeriod
    ]);

    // Add default leave balance
    await conn.execute(
      'INSERT INTO EmployeeLeave (EmpId, SL, EL, Tenent_Id) VALUES (?, 1, 0.00, ?)',
      [EmpId, Tenent_Id || 1]
    );

    await conn.commit();
    response.success = true;
    response.message = 'Employee, office details, and leave balances added successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in addEmployee:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.json(response);
  } finally {
    conn.release();
  }
};

// 2. Edit Employee (src/employee/edit_employee.php);

module.exports = addEmployee;
