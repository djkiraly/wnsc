const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

// Google OAuth initiation
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to client
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  }
);

// Get current user
router.get('/user', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        profilePicture: req.user.profile_picture,
        role: req.user.role,
        status: req.user.status,
        phone: req.user.phone,
        organization: req.user.organization,
        bio: req.user.bio
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role
    } : null
  });
});

module.exports = router;