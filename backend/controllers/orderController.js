const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

const orderController = {
  // Create order (checkout)
  createOrder: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Check if cart is empty
      const cart = await Cart.findByUserId(userId);
      if (cart.cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot create order: Cart is empty'
        });
      }

      // Get user address
      const user = await User.findById(userId);
      if (!user || !user.shipping_address) {
        return res.status(400).json({
          success: false,
          error: 'Shipping address not found'
        });
      }

      // Create order
      const order = await Order.create(userId, user.shipping_address);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: {
            id: order.orderId,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Create order error:', error);
      
      if (error.message === 'Cart is empty') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get order list
  getOrders: async (req, res) => {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await Order.findByUserId(userId, page, limit);

      res.json({
        success: true,
        data: {
          orders: result.orders,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: result.limit,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get order list error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get order details
  getOrderById: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { orderId } = req.params;

      const order = await Order.findById(userId, orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = orderController;