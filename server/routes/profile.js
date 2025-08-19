const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/profile - Get current user's profile data
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT id, google_id, email, first_name, last_name, profile_picture, 
              role, status, phone, organization, bio, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const user = result.rows[0];
    
    res.json({
      success: true,
      profile: {
        id: user.id,
        googleId: user.google_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePicture: user.profile_picture,
        role: user.role,
        status: user.status,
        phone: user.phone,
        organization: user.organization,
        bio: user.bio,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /api/profile - Update current user's profile data
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, organization, bio } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    // Sanitize input
    const sanitizedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : null,
      organization: organization ? organization.trim() : null,
      bio: bio ? bio.trim() : null
    };

    // Validate field lengths
    if (sanitizedData.firstName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'First name must be 100 characters or less'
      });
    }

    if (sanitizedData.lastName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be 100 characters or less'
      });
    }

    if (sanitizedData.phone && sanitizedData.phone.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 20 characters or less'
      });
    }

    if (sanitizedData.organization && sanitizedData.organization.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Organization must be 100 characters or less'
      });
    }

    // Update user profile
    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, organization = $4, bio = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, first_name, last_name, profile_picture, role, status, phone, organization, bio, updated_at`,
      [sanitizedData.firstName, sanitizedData.lastName, sanitizedData.phone, sanitizedData.organization, sanitizedData.bio, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        profilePicture: updatedUser.profile_picture,
        role: updatedUser.role,
        status: updatedUser.status,
        phone: updatedUser.phone,
        organization: updatedUser.organization,
        bio: updatedUser.bio,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;