// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
  };
};

// Middleware for admin only routes
const requireAdmin = requireRole(['admin']);

// Middleware for admin and organizer routes
const requireOrganizer = requireRole(['admin', 'organizer']);

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireOrganizer
};