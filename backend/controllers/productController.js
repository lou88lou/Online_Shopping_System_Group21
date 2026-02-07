const Product = require('../models/Product');

const productController = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      if (limit > 50) {
        return res.status(400).json({
          success: false,
          error: 'Maximum items per page is 50'
        });
      }

      const result = await Product.findAll(page, limit);

      res.json({
        success: true,
        data: {
          products: result.products,
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
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { message: error.message })
      });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const { keyword } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!keyword || keyword.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Search keyword is required'
        });
      }

      const result = await Product.search(keyword.trim(), page, limit);

      res.json({
        success: true,
        data: {
          products: result.products,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: result.limit,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1
          },
          searchKeyword: keyword
        }
      });
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get product details
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      console.error('Get product details error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = productController;