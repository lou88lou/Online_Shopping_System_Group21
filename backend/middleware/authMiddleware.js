const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Verify JWT token
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired'
        });
      }
      
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
  },

  // Optional authentication
  optionalAuth: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
      } catch (error) {
        // Ignore invalid token
      }
    }
    
    next();
  }
};

module.exports = authMiddleware;