const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, first_name, last_name, profile_picture, role, status, 
             phone, organization, bio, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, first_name, last_name, profile_picture, role, status,
             phone, organization, bio, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { first_name, last_name, phone, organization, bio } = req.body;
    
    const result = await db.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, phone = $3, organization = $4, bio = $5
      WHERE id = $6
      RETURNING id, email, first_name, last_name, profile_picture, role, status,
                phone, organization, bio, created_at, updated_at
    `, [first_name, last_name, phone, organization, bio, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'organizer', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const result = await db.query(`
      UPDATE users 
      SET role = $1
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role
    `, [role, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Update user status (admin only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await db.query(`
      UPDATE users 
      SET status = $1
      WHERE id = $2
      RETURNING id, email, first_name, last_name, status
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Update user details (admin only)
router.put('/:id/details', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, organization, bio } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email is already taken by another user
    const emailCheck = await db.query(`
      SELECT id FROM users WHERE email = $1 AND id != $2
    `, [email, id]);

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }

    const result = await db.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, phone = $4, organization = $5, bio = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, email, first_name, last_name, profile_picture, role, status,
                phone, organization, bio, created_at, updated_at
    `, [first_name, last_name, email, phone, organization, bio, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
      message: 'User details updated successfully'
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user details'
    });
  }
});

// Get user's tasks
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, e.title as event_title,
             u1.first_name as assigned_to_first_name, u1.last_name as assigned_to_last_name,
             u2.first_name as created_by_first_name, u2.last_name as created_by_last_name
      FROM tasks t
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.assigned_to = $1
      ORDER BY t.due_date ASC, t.priority DESC
    `, [req.user.id]);

    res.json({
      success: true,
      tasks: result.rows
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

module.exports = router;