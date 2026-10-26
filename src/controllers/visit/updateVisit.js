const db = require('../../config/db');

const updateVisit = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};
  const visitId = req.params?.id || data.visitId || data.VisitID || data.id || null;

  if (!visitId) {
    response.message = 'Please provide visitId to update.';
    return res.status(400).json(response);
  }

  try {
    const fields = [];
    const values = [];

    if (data.status !== undefined || data.Status !== undefined) {
      fields.push('Status = ?');
      values.push(data.status || data.Status);
    }

    if (data.planVisit !== undefined || data.Plan_Visit !== undefined) {
      fields.push('Plan_Visit = ?');
      values.push(data.planVisit || data.Plan_Visit);
    }

    if (data.remarks !== undefined || data.Remarks !== undefined) {
      fields.push('Remarks = ?');
      values.push(data.remarks || data.Remarks);
    }

    if (data.purpose !== undefined || data.Purpose !== undefined) {
      fields.push('Purpose = ?');
      values.push(data.purpose || data.Purpose);
    }

    if (data.mode !== undefined || data.Mode !== undefined) {
      fields.push('Mode = ?');
      values.push(data.mode || data.Mode);
    }

    if (data.visitLatLong !== undefined || data.latLong !== undefined) {
      fields.push('VisitLatLong = ?');
      values.push(data.visitLatLong || data.latLong);
    }

    if (fields.length === 0) {
      response.message = 'No valid fields provided to update.';
      return res.status(400).json(response);
    }

    values.push(visitId);
    const sql = `UPDATE Visit SET ${fields.join(', ')} WHERE VisitID = ?`;

    const [result] = await db.execute(sql, values);

    if (result.affectedRows === 0) {
      response.message = `Visit with ID #${visitId} not found.`;
      return res.status(404).json(response);
    }

    response.success = true;
    response.message = 'Visit updated successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in updateVisit:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = updateVisit;
