const pool = require('../../config/db');

/**
 * GET /product/get_products.php (or /product/list)
 * Query Params:
 *  - search: string (matches name, code, composition, packaging)
 *  - category: string
 *  - unit: string
 *  - status: string (Active/Inactive/All)
 *  - Tenent_Id: number
 */
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      unit,
      status,
      Tenent_Id
    } = req.query || req.body || {};

    const tenantId = Tenent_Id || 1;
    let query = 'SELECT * FROM products WHERE (Tenent_Id = ? OR Tenent_Id IS NULL)';
    const params = [tenantId];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (unit && unit !== 'All') {
      query += ' AND unit = ?';
      params.push(unit);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (name LIKE ? OR product_code LIKE ? OR composition LIKE ? OR packaging LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);

    // Compute stats across all products for this tenant
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as totalProducts,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeProducts,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactiveProducts,
        AVG(price) as avgPrice,
        COUNT(DISTINCT category) as totalCategories
       FROM products 
       WHERE (Tenent_Id = ? OR Tenent_Id IS NULL)`,
      [tenantId]
    );

    const stats = statsRows[0] || {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      avgPrice: 0,
      totalCategories: 0
    };

    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      count: rows.length,
      stats: {
        totalProducts: Number(stats.totalProducts) || 0,
        activeProducts: Number(stats.activeProducts) || 0,
        inactiveProducts: Number(stats.inactiveProducts) || 0,
        avgPrice: Math.round((Number(stats.avgPrice) || 0) * 100) / 100,
        totalCategories: Number(stats.totalCategories) || 0
      },
      data: rows
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

module.exports = getProducts;
