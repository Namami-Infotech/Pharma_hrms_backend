const db = require('../../config/db');

const addDealer = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const dealerName = data.dealerName || '';
  const address = data.address || '';
  const contactInfo = data.contactInfo || '';
  const latLong = data.latLong || '';
  const companyName = data.companyName || '';
  const mailId = data.mailId || '';
  const remarks = data.remarks || '';
  const addedByEmpId = data.addedByEmpId || '';

  if (
    !dealerName ||
    !address ||
    !contactInfo ||
    !latLong ||
    !addedByEmpId ||
    !companyName ||
    !mailId
  ) {
    response.message =
      'Please provide all required fields: dealerName, address, contactInfo, latLong, companyName, mailId, remarks, and addedByEmpId.';
    return res.json(response);
  }

  try {
    const insertSql = `
      INSERT INTO Dealers (DealerName, Address, ContactInfo, LatLong, CompanyName, MailId, Remarks, AddedByEmpId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertSql, [
      dealerName,
      address,
      contactInfo,
      latLong,
      companyName,
      mailId,
      remarks,
      addedByEmpId
    ]);

    response.success = true;
    response.message = 'Dealer added successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in addDealer:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 2. Get Dealers (src/dealer/get_dealers.php);

module.exports = addDealer;
