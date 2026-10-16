const { getMenuByTenent: getMenu } = require('./authHelper');

// Endpoint handler for /auth/get_menu_by_tenent.php
const getMenuByTenent = async (req, res) => {
  const tenentId = req.query.tenent_id || req.body.tenent_id || req.query.Tenent_Id || req.body.Tenent_Id;
  const menu = await getMenu(tenentId);
  return res.json({ success: true, modules: menu });
};

module.exports = getMenuByTenent;
