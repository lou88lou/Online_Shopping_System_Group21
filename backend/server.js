const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'E-commerce Backend System',
    version: '1.0.0',
    requirements: 'A1-A20 (Block A)'
  });
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    project: 'E-commerce System - Group 21',
    module: 'Block A (Core Features)',
    endpoints: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getUserInfo: 'GET /api/auth/me'
      },
      products: {
        getProducts: 'GET /api/products?page=1&limit=10',
        searchProducts: 'GET /api/products/search?keyword=',
        getProductDetails: 'GET /api/products/:id'
      },
      cart: {
        getCart: 'GET /api/cart',
        addItem: 'POST /api/cart',
        updateQuantity: 'PUT /api/cart/:cartItemId',
        removeItem: 'DELETE /api/cart/:cartItemId',
        clearCart: 'DELETE /api/cart'
      },
      orders: {
        createOrder: 'POST /api/orders',
        getOrders: 'GET /api/orders',
        getOrderDetails: 'GET /api/orders/:orderId'
      },
      admin: {
        getProducts: 'GET /api/admin/products?page=&limit=&keyword=&product_id=',
        getProduct: 'GET /api/admin/products/:id',
        createProduct: 'POST /api/admin/products',
        updateProduct: 'PUT /api/admin/products/:id',
        disableProduct: 'PATCH /api/admin/products/:id/disable',
        enableProduct: 'PATCH /api/admin/products/:id/enable',
        getOrders: 'GET /api/admin/orders?page=&limit=',
        getOrderDetail: 'GET /api/admin/orders/:orderId'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(` Backend server running on port ${PORT}`);
  console.log(` API documentation: http://localhost:${PORT}/api/docs`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Test user: test@example.com / test123`);
});