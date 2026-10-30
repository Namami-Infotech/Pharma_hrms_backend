const db = require('../../config/db');

const deleteQuotation = async (req, res) => {
  const response = { success: false, message: '' };
  const id = req.params.id || req.query.id || req.body.id;

  if (!id) {
    response.message = 'Quotation ID is required for deletion.';
    return res.status(400).json(response);
  }

  try {
    const [existing] = await db.query('SELECT id, status, quotation_no FROM Quotations WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      response.message = 'Quotation not found or already deleted.';
      return res.status(404).json(response);
    }

    const currentStatus = existing[0].status;
    const isLocked = ['Sent', 'Approved', 'Pending Approval', 'Pending'].includes(currentStatus);
    if (isLocked) {
      response.message = 'Quotation cannot be deleted once it has been sent or submitted for approval.';
      return res.status(400).json(response);
    }

    const [result] = await db.query('DELETE FROM Quotations WHERE id = ?', [id]);

    response.success = true;
    response.message = 'Quotation deleted successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error deleting quotation:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = deleteQuotation;
