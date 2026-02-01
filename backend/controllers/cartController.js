const Cart = require('../models/Cart');
const Product = require('../models/Product');

const cartController = {
  // Get cart
  getCart: async (req, res) => {
    try {
      const userId = req.user.userId;
      const cart = await Cart.findByUserId(userId);

      res.json({
        success: true,
        data: {
          cartItems: cart.cartItems,
          totalAmount: cart.totalAmount,
          itemCount: cart.cartItems.length
        }
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { productId, quantity = 1 } = req.body;

      // Verify product exists
      const productExists = await Product.exists(productId);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Validate quantity
      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a positive integer'
        });
      }

      const result = await Cart.addItem(userId, productId, parsedQuantity);
      const cart = await Cart.findByUserId(userId);

      res.status(result.updated ? 200 : 201).json({
        success: true,
        message: result.updated ? 'Cart item updated' : 'Item added to cart',
        data: {
          cart,
          action: result.updated ? 'updated' : 'added'
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity)) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a number'
        });
      }

      const result = await Cart.updateItem(userId, cartItemId, parsedQuantity);
      const cart = await Cart.findByUserId(userId);

      res.json({
        success: true,
        message: result.removed ? 'Item removed from cart' : 'Cart item updated',
        data: {
          cart,
          action: result.removed ? 'removed' : 'updated'
        }
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      
      if (error.message === 'Cart item not found') {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { cartItemId } = req.params;

      const removed = await Cart.removeItem(userId, cartItemId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Cart item not found'
        });
      }

      const cart = await Cart.findByUserId(userId);

      res.json({
        success: true,
        message: 'Item removed from cart',
        data: { cart }
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const userId = req.user.userId;

      const isEmpty = await Cart.isEmpty(userId);
      if (isEmpty) {
        return res.json({
          success: true,
          message: 'Cart is already empty',
          data: { cart: { cartItems: [], totalAmount: 0 } }
        });
      }

      const clearedCount = await Cart.clear(userId);

      res.json({
        success: true,
        message: `Cart cleared (removed ${clearedCount} items)`,
        data: {
          cart: {
            cartItems: [],
            totalAmount: 0
          },
          clearedCount
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = cartController;