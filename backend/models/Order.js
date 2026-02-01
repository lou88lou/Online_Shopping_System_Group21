const db = require('../config/db');

class Order {
  // 生成订单号
  static generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  // 创建订单
  static async create(userId, shippingAddress) {
    return await db.transaction(async (connection) => {
      // 获取购物车商品
      const cartSql = `
        SELECT 
          ci.product_id,
          ci.quantity,
          p.price,
          (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ? AND p.is_active = TRUE
      `;
      
      const [cartItems] = await connection.execute(cartSql, [userId]);
      
      if (cartItems.length === 0) {
        throw new Error('购物车为空');
      }

      // 计算总金额
      const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // 创建订单
      const orderNumber = this.generateOrderNumber();
      const orderSql = `
        INSERT INTO orders (order_number, user_id, shipping_address, total_amount, status) 
        VALUES (?, ?, ?, ?, 'pending')
      `;
      
      const [orderResult] = await connection.execute(orderSql, [
        orderNumber, userId, shippingAddress, totalAmount
      ]);
      
      const orderId = orderResult.insertId;

      // 创建订单项
      const orderItems = cartItems.map(item => [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        item.subtotal
      ]);
      
      if (orderItems.length > 0) {
        const orderItemsSql = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
          VALUES ?
        `;
        await connection.query(orderItemsSql, [orderItems]);
      }

      // 清空购物车
      await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      return {
        orderId,
        orderNumber,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      };
    });
  }

  // 获取用户订单列表
  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const ordersSql = `
      SELECT 
        id,
        order_number,
        purchase_date,
        total_amount,
        status
      FROM orders 
      WHERE user_id = ? 
      ORDER BY purchase_date DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [countResult, orders] = await Promise.all([
      db.query(countSql, [userId]),
      db.query(ordersSql, [userId, limit, offset])
    ]);
    
    return {
      orders,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // 获取订单详情
  static async findById(userId, orderId) {
    const orderSql = `
      SELECT 
        order_number,
        purchase_date,
        shipping_address,
        total_amount,
        status
      FROM orders 
      WHERE id = ? AND user_id = ?
    `;
    
    const orders = await db.query(orderSql, [orderId, userId]);
    
    if (orders.length === 0) {
      return null;
    }
    
    const order = orders[0];
    
    // 获取订单商品项
    const itemsSql = `
      SELECT 
        oi.product_id,
        p.name as product_name,
        oi.quantity,
        oi.unit_price,
        oi.subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    const items = await db.query(itemsSql, [orderId]);
    order.items = items;
    
    return order;
  }
}

module.exports = Order;