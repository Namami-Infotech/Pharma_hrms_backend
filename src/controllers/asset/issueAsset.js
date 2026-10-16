const db = require('../../config/db');

// 3. Issue Asset (src/assets/issue_asset.php)
const issueAsset = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = data.EmpId || '';
  const assets = data.assets || [];

  if (!EmpId || !Array.isArray(assets) || assets.length === 0) {
    response.message = 'Employee ID and assets data are required.';
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [empCheck] = await conn.query(
      'SELECT COUNT(*) as count FROM Employees WHERE EmpId = ?',
      [EmpId]
    );

    if (empCheck[0].count === 0) {
      await conn.rollback();
      response.message = 'Employee not found.';
      return res.json(response);
    }

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const asset of assets) {
      const assetId = asset.asset_id || '';
      const makeName = asset.make_name || '';
      const modelName = asset.model_name || '';
      const serialNumber = asset.serial_number || '';
      const status = asset.status || '';
      const remark = asset.remark || '';

      if (!assetId || !status) {
        await conn.rollback();
        response.message = 'Asset ID and status are required for each asset.';
        return res.json(response);
      }

      const [assetRows] = await conn.query(
        'SELECT product_name FROM assets WHERE id = ?',
        [assetId]
      );

      if (!assetRows || assetRows.length === 0) {
        await conn.rollback();
        response.message = `Asset not found for ID: ${assetId}`;
        return res.json(response);
      }

      const assetName = assetRows[0].product_name;

      const insertSql = `
        INSERT INTO assets_issue (emp_id, asset_id, asset_name, serial_number, make_name, model_name, status, remark, issue_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await conn.execute(insertSql, [
        EmpId,
        assetId,
        assetName,
        serialNumber,
        makeName,
        modelName,
        status,
        remark,
        currentDate
      ]);
    }

    await conn.commit();
    response.success = true;
    response.message = 'Assets issued successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in issueAsset:', err);
    response.message = `Error issuing assets: ${err.message}`;
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
};

module.exports = issueAsset;
