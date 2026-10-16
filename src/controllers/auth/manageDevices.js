const db = require('../../config/db');

// 4. Device Management (src/auth/devices.php)
const manageDevices = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const devices = data.devices || [];

  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    response.message = 'No devices provided.';
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const device of devices) {
      const LoginId = device.LoginId || '';
      const Mobile = device.Mobile || null;
      const Token = device.Token || '';
      const Make = device.Make || '';
      const Model = device.Model || '';
      const OS = device.OS || '';
      const OSVer = device.OSVer || '';
      const AppVer = device.AppVer || null;
      const Registered = device.Registered || '';
      const UpdateDate = device.UpdateDate || '';

      if (
        !LoginId ||
        !Mobile ||
        !Token ||
        !Make ||
        !Model ||
        !OS ||
        !OSVer ||
        !AppVer ||
        !Registered
      ) {
        await conn.rollback();
        response.message = 'Please provide valid device data.';
        return res.json(response);
      }

      // Check if device with LoginId exists
      const [existing] = await conn.query(
        'SELECT * FROM Devices WHERE LoginId = ?',
        [LoginId]
      );

      if (existing && existing.length > 0) {
        const existingDevice = existing[0];
        const DeviceId = existingDevice.DeviceId;
        const serverDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await conn.execute(
          `INSERT INTO Devices_Audit 
           (DeviceId, EmpId, Mobile, Token, Make, Model, OS, OSVer, AppVer, NetworkType, Active, Registered, \`Update\`, Server_Date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            DeviceId,
            LoginId,
            existingDevice.Mobile,
            existingDevice.Token,
            existingDevice.Make,
            existingDevice.Model,
            existingDevice.OS,
            existingDevice.OSVer,
            existingDevice.AppVer,
            existingDevice.NetworkType,
            existingDevice.Active,
            existingDevice.Registered,
            existingDevice.UpdateDate,
            serverDate
          ]
        );

        await conn.execute('DELETE FROM Devices WHERE DeviceId = ?', [DeviceId]);
      }

      await conn.execute(
        `INSERT INTO Devices 
         (LoginId, Mobile, Token, Make, Model, OS, OSVer, AppVer, Registered, UpdateDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          LoginId,
          Mobile,
          Token,
          Make,
          Model,
          OS,
          OSVer,
          AppVer,
          Registered,
          UpdateDate
        ]
      );
    }

    await conn.commit();
    response.success = true;
    response.message = 'Device data updated successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in manageDevices:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
};

module.exports = manageDevices;
