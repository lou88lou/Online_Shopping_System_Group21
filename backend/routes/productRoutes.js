const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 公开路由（无需登录）
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);

module.exports = router;