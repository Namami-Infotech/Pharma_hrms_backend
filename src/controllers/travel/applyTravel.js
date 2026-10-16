const db = require('../../config/db');

const applyTravel = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};
  const application = data.application || null;

  if (application) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const empId = application.empId || '';
    const travelDate = application.travelDate || '';
    const travelFrom = application.travelFrom || '';
    const travelTo = application.travelTo || '';
    const travelType = application.travelType || '';
    const status = application.status || 'Pending';
    const remark = application.remark || '';

    if (empId && travelDate && travelFrom && travelTo && travelType) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const insertSql = `
          INSERT INTO TravelExpenses 
          (batchId, empId, travelDate, travelFrom, travelTo, travelType, status, remark) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await conn.execute(insertSql, [
          batchId,
          empId,
          travelDate,
          travelFrom,
          travelTo,
          travelType,
          status,
          remark
        ]);

        await conn.commit();
        response.success = true;
        response.message = `Travel application applied successfully with batch ID: ${batchId}.`;
        return res.json(response);
      } catch (err) {
        await conn.rollback();
        console.error('Error in applyTravel:', err);
        response.message = `An error occurred: ${err.message}`;
        return res.status(500).json(response);
      } finally {
        conn.release();
      }
    } else {
      response.message = 'Please provide valid travel application data.';
      return res.json(response);
    }
  } else {
    response.message = 'No travel application provided.';
    return res.json(response);
  }
};

// 2. Get Travel (src/travel/get_travel.php);

module.exports = applyTravel;
