const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * PROTECT ROUTE MIDDLEWARE
 * Enforces authentication by verifying the JWT Bearer token.
 */
const protectRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'convo_dev_fallback_secret_321');
    
    // We fetch the latest user data to ensure the account hasn't been deleted or banned
    const user = UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    // Attach user to req object for downstream use in controllers
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    res.status(401).json({ success: false, error: 'Not authorized, token invalid or expired' });
  }
};

module.exports = protectRoute;
