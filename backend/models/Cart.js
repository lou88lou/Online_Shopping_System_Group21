const db = require('../config/db');

class Cart {
  // 获取用户购物车
  static async findByUserId(userId) {
    const sql = `
      SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.thumbnail_url,
        (ci.quantity * p.price) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = TRUE
      ORDER BY ci.created_at DESC
    `;
    
    const cartItems = await db.query(sql, [userId]);
    
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    return {
      cartItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  }

  // 添加商品到购物车
  static async addItem(userId, productId, quantity = 1) {
    const existingSql = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?';
    const existingItems = await db.query(existingSql, [userId, productId]);
    
    if (existingItems.length > 0) {
      const newQuantity = existingItems[0].quantity + quantity;
      const updateSql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
      await db.query(updateSql, [newQuantity, existingItems[0].id]);
      return { updated: true, cartItemId: existingItems[0].id };
    } else {
      const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
      const result = await db.query(insertSql, [userId, productId, quantity]);
      return { updated: false, cartItemId: result.insertId };
    }
  }

  // 更新购物车商品数量
  static async updateItem(userId, cartItemId, quantity) {
    const checkSql = 'SELECT id FROM cart_items WHERE id = ? AND user_id = ?';
    const items = await db.query(checkSql, [cartItemId, userId]);
    
    if (items.length === 0) {
      throw new Error('购物车商品不存在');
    }
    
    if (quantity <= 0) {
      await this.removeItem(userId, cartItemId);
      return { removed: true };
    } else {
      const updateSql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
      await db.query(updateSql, [quantity, cartItemId]);
      return { removed: false };
    }
  }

  // 从购物车移除商品
  static async removeItem(userId, cartItemId) {
    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
    const result = await db.query(sql, [cartItemId, userId]);
    return result.affectedRows > 0;
  }

  // 清空购物车
  static async clear(userId) {
    const sql = 'DELETE FROM cart_items WHERE user_id = ?';
    const result = await db.query(sql, [userId]);
    return result.affectedRows;
  }

  // 检查购物车是否为空
  static async isEmpty(userId) {
    const sql = 'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?';
    const result = await db.query(sql, [userId]);
    return result[0].count === 0;
  }
}

module.exports = Cart;