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

  // ---------- 管理端专用（A14-A18），前台勿用 ----------
  // 管理端商品列表，支持按名称、商品ID子串筛选，含已禁用商品
  static async findAllForAdmin(page = 1, limit = 10, nameKeyword = '', idSubstring = '') {
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offsetNum = Math.max(0, (parseInt(page, 10) || 1) - 1) * limitNum;
    const conditions = [];
    const params = [];
    if (nameKeyword && nameKeyword.trim()) {
      conditions.push('name LIKE ?');
      params.push(`%${nameKeyword.trim()}%`);
    }
    if (idSubstring && idSubstring.trim()) {
      conditions.push('CAST(id AS CHAR) LIKE ?');
      params.push(`%${idSubstring.trim()}%`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const productsSql = `
      SELECT id, name, price, thumbnail_url, description, is_active, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY id DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    const [countResult, products] = await Promise.all([
      db.query(countSql, params),
      db.query(productsSql, params)
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

  // 管理端按ID获取商品（含已禁用，用于编辑）
  static async findByIdForAdmin(id) {
    const sql = 'SELECT id, name, price, thumbnail_url, description, is_active, created_at, updated_at FROM products WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  // 管理端新增商品
  static async createForAdmin(data) {
    const { name, price, thumbnail_url, description } = data;
    const sql = `
      INSERT INTO products (name, price, thumbnail_url, description, is_active)
      VALUES (?, ?, ?, ?, TRUE)
    `;
    const result = await db.query(sql, [
      name || '',
      price != null ? Number(price) : 0,
      thumbnail_url || null,
      description || null
    ]);
    return result && result.insertId != null ? result.insertId : null;
  }

  // 管理端更新商品信息
  static async updateForAdmin(id, data) {
    const { name, price, thumbnail_url, description } = data;
    const sql = `
      UPDATE products SET name = ?, price = ?, thumbnail_url = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.query(sql, [
      name != null ? name : '',
      price != null ? Number(price) : 0,
      thumbnail_url !== undefined ? thumbnail_url : null,
      description !== undefined ? description : null,
      id
    ]);
    return id;
  }

  // 管理端启用/禁用商品（是否在前台展示）
  static async setActiveForAdmin(id, isActive) {
    const sql = 'UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(sql, [!!isActive, id]);
    return id;
  }
}

module.exports = Product;