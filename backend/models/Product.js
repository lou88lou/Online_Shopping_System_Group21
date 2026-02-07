const db = require('../config/db');

class Product {
  // 获取所有商品（LIMIT/OFFSET 用整数拼接，避免部分 MySQL 对预处理参数报错）
  static async findAll(page = 1, limit = 10) {
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offsetNum = Math.max(0, (parseInt(page, 10) || 1) - 1) * limitNum;

    const countSql = 'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE';
    const productsSql = `
      SELECT id, name, price, thumbnail_url, created_at 
      FROM products 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [countResult, products] = await Promise.all([
      db.query(countSql),
      db.query(productsSql)
    ]);
    const total = Number(countResult && countResult[0] && countResult[0].total) || 0;
    return {
      products: products || [],
      total,
      page: parseInt(page, 10) || 1,
      limit: limitNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0
    };
  }

  // 搜索商品（LIMIT/OFFSET 用整数拼接）
  static async search(keyword, page = 1, limit = 10) {
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offsetNum = Math.max(0, (parseInt(page, 10) || 1) - 1) * limitNum;
    const searchTerm = `%${keyword}%`;

    const countSql = `
      SELECT COUNT(*) as total 
      FROM products 
      WHERE is_active = TRUE AND name LIKE ?
    `;
    const productsSql = `
      SELECT id, name, price, thumbnail_url, created_at 
      FROM products 
      WHERE is_active = TRUE AND name LIKE ?
      ORDER BY created_at DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [countResult, products] = await Promise.all([
      db.query(countSql, [searchTerm]),
      db.query(productsSql, [searchTerm])
    ]);
    const total = Number(countResult && countResult[0] && countResult[0].total) || 0;
    return {
      products: products || [],
      total,
      page: parseInt(page, 10) || 1,
      limit: limitNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0
    };
  }

  // 通过ID获取商品详情
  static async findById(id) {
    const sql = `
      SELECT id, name, price, thumbnail_url, description, created_at 
      FROM products 
      WHERE id = ? AND is_active = TRUE
    `;
    const products = await db.query(sql, [id]);
    return products[0];
  }

  // 检查商品是否存在
  static async exists(id) {
    const sql = 'SELECT COUNT(*) as count FROM products WHERE id = ? AND is_active = TRUE';
    const result = await db.query(sql, [id]);
    return result[0].count > 0;
  }
}

module.exports = Product;