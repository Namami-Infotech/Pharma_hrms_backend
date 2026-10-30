const COMPANY_DETAILS = {
  name: 'M/S ABERDURE PHARMA',
  tagline: 'Quality Medicines For Better Health',
  address: '1ST FLOOR, SHOP 28 PROP.NO 920-21 WARD NO 07 KH NO 1151/3, BISHAN SWAROOP COMPLEX, MEHRAULI MAIN MARKET, MEHRAULI, NEW DELHI, SOUTH DELHI, DELHI, 110030',
  phone: '+91 98112 23344, +91 11 2664 4556',
  email: 'info@aberdurepharma.com',
  website: 'www.aberdurepharma.com',
  gstin: '07AAXFA1234B1Z9',
  dlNo: 'DL-20B/21B-12345/67',
  pan: 'AAXFA1234B'
};

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += (nArr[1] != 0) ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += (nArr[2] != 0) ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += (nArr[3] != 0) ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += (nArr[4] != 0) ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += (nArr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  };

  const val = Math.round(Number(num) || 0);
  if (val <= 0) return 'Zero Rupees Only';
  return (inWords(val) + ' Rupees Only');
};

/**
 * Checks if any item has discount > 35%, or overall discount > 35%
 */
const checkDiscountRequiresApproval = (items = [], overallDiscount = 0) => {
  let parsed = [];
  try {
    parsed = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items || '[]') : []);
  } catch (_) {
    parsed = [];
  }

  const hasItemAboveLimit = parsed.some((it) => {
    const disc = parseFloat(it.discount) || 0;
    return disc > 35;
  });

  const hasOverallAboveLimit = (parseFloat(overallDiscount) || 0) > 35;

  return hasItemAboveLimit || hasOverallAboveLimit;
};

/**
 * Looks up the RM's email for a given employee (by EmpId, Name, or id)
 */
const getRmEmailForEmployee = async (db, empIdentifier) => {
  if (!empIdentifier) return null;
  try {
    const [empRows] = await db.query(
      'SELECT EmpId, Name, EmailId, RM FROM Employees WHERE EmpId = ? OR Name = ? OR id = ? LIMIT 1',
      [empIdentifier, empIdentifier, empIdentifier]
    );
    if (!empRows || empRows.length === 0) return null;
    const emp = empRows[0];
    if (!emp.RM) return null;

    const [rmRows] = await db.query(
      'SELECT EmpId, Name, EmailId FROM Employees WHERE EmpId = ? OR Name = ? OR id = ? LIMIT 1',
      [emp.RM, emp.RM, emp.RM]
    );
    if (rmRows && rmRows.length > 0 && rmRows[0].EmailId) {
      return rmRows[0].EmailId.trim();
    }
  } catch (err) {
    console.warn('[QuotationHelper] Error finding RM email:', err.message);
  }
  return null;
};

module.exports = {
  COMPANY_DETAILS,
  numberToWords,
  checkDiscountRequiresApproval,
  getRmEmailForEmployee
};
