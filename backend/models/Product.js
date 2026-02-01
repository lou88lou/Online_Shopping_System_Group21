const db = require('../config/db');

class Product {
  // 获取所有商品（分页）
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const countSql = 'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE';
    const productsSql = `
      SELECT id, name, price, thumbnail_url, created_at 
      FROM products 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [countResult, products] = await Promise.all([
      db.query(countSql),
      db.query(productsSql, [limit, offset])
    ]);
    
    return {
      products,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // 搜索商品
  static async search(keyword, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
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
      LIMIT ? OFFSET ?
    `;
    
    const [countResult, products] = await Promise.all([
      db.query(countSql, [searchTerm]),
      db.query(productsSql, [searchTerm, limit, offset])
    ]);
    
    return {
      products,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
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