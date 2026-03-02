const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// 所有订单路由都需要认证
router.use(authMiddleware.authenticateToken);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);

module.exports = router;