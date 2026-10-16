const db = require('../../config/db');

const updateTravelStatus = async (req, res) => {
  const response = { success: false, message: '' };
  const input = req.body || {};

  if (input.id !== undefined && input.status !== undefined) {
    const id = input.id;
    const status = input.status;

    try {
      const [result] = await db.execute(
        'UPDATE TravelExpenses SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows > 0) {
        response.success = true;
      } else {
        response.message = 'Failed to update travel status.';
      }

      return res.json(response);
    } catch (err) {
      console.error('Error in updateTravelStatus:', err);
      response.message = `An error occurred: ${err.message}`;
      return res.status(500).json(response);
    }
  } else {
    response.message = 'No travel applications provided.';
    return res.json(response);
  }
};

module.exports = updateTravelStatus;
