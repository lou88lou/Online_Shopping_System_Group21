const db = require('../config/db');

class User {
  // 创建用户
  static async create(fullName, email, password, shippingAddress) {
    const sql = `
      INSERT INTO users (full_name, email, password, shipping_address) 
      VALUES (?, ?, ?, ?)
    `;
    const result = await db.query(sql, [fullName, email, password, shippingAddress]);
    return result.insertId;
  }

  // 通过邮箱查找用户
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await db.query(sql, [email]);
    return users[0];
  }

  // 通过ID查找用户
  static async findById(id) {
    const sql = 'SELECT id, full_name, email, shipping_address, created_at FROM users WHERE id = ?';
    const users = await db.query(sql, [id]);
    return users[0];
  }

  // 检查邮箱是否已存在
  static async emailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const result = await db.query(sql, [email]);
    return result[0].count > 0;
  }
}

module.exports = User;