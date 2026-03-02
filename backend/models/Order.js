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

  // ---------- 管理端专用（A19、A20），商家查看订单列表与详情 ----------
  // 管理端订单列表，按购买日期倒序，含客户姓名
  static async findAllForAdmin(page = 1, limit = 10) {
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offsetNum = Math.max(0, (parseInt(page, 10) || 1) - 1) * limitNum;
    const countSql = 'SELECT COUNT(*) as total FROM orders';
    const ordersSql = `
      SELECT
        o.id,
        o.order_number,
        o.purchase_date,
        o.total_amount,
        o.status,
        u.full_name AS customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.purchase_date DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    const [countResult, orders] = await Promise.all([
      db.query(countSql),
      db.query(ordersSql)
    ]);
    const total = Number(countResult && countResult[0] && countResult[0].total) || 0;
    return {
      orders: orders || [],
      total,
      page: parseInt(page, 10) || 1,
      limit: limitNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0
    };
  }

  // 管理端按订单ID获取订单详情（含订单项，不校验用户）
  static async findByIdForAdmin(orderId) {
    const orderSql = `
      SELECT
        o.id,
        o.order_number,
        o.purchase_date,
        o.shipping_address,
        o.total_amount,
        o.status,
        u.full_name AS customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    const orders = await db.query(orderSql, [orderId]);
    if (!orders || orders.length === 0) return null;
    const order = orders[0];
    const itemsSql = `
      SELECT
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.unit_price,
        oi.subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [orderId]);
    order.items = items || [];
    return order;
  }
}

module.exports = Order;