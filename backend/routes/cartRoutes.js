const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// 所有购物车路由都需要认证
router.use(authMiddleware.authenticateToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:cartItemId', cartController.updateCartItem);
router.delete('/:cartItemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;