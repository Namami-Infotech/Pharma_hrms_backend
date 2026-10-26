const db = require('../../config/db');

const deleteQuotation = async (req, res) => {
  const response = { success: false, message: '' };
  const id = req.params.id || req.query.id || req.body.id;

  if (!id) {
    response.message = 'Quotation ID is required for deletion.';
    return res.status(400).json(response);
  }

  try {
    const [result] = await db.query('DELETE FROM Quotations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      response.message = 'Quotation not found or already deleted.';
      return res.status(404).json(response);
    }

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
