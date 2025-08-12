const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Get all directory entries
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, type } = req.query;
    
    let query = `
      SELECT d.*, u.first_name as added_by_first_name, u.last_name as added_by_last_name
      FROM directory d
      LEFT JOIN users u ON d.added_by = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push(`(
        d.contact_name ILIKE $${params.length + 1} OR 
        d.organization ILIKE $${params.length + 1} OR 
        d.email ILIKE $${params.length + 1} OR
        d.phone ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }
    
    if (type && type !== 'all') {
      conditions.push(`d.contact_type = $${params.length + 1}`);
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY d.contact_name ASC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      contacts: result.rows
    });
  } catch (error) {
    console.error('Error fetching directory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch directory'
    });
  }
});

// Get single directory entry
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT d.*, u.first_name as added_by_first_name, u.last_name as added_by_last_name
      FROM directory d
      LEFT JOIN users u ON d.added_by = u.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
});

// Create new directory entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      contact_name,
      organization,
      title,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      website,
      notes,
      contact_type
    } = req.body;
    
    // Validate required fields
    if (!contact_name || contact_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Contact name is required'
      });
    }
    
    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }
    
    // Validate contact type
    const validTypes = ['contact', 'organization', 'vendor', 'sponsor', 'partner'];
    if (contact_type && !validTypes.includes(contact_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact type'
      });
    }
    
    const result = await db.query(`
      INSERT INTO directory (
        contact_name, organization, title, email, phone, address, city, state, 
        zip_code, website, notes, contact_type, added_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      contact_name.trim(),
      organization?.trim() || null,
      title?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      address?.trim() || null,
      city?.trim() || null,
      state?.trim() || null,
      zip_code?.trim() || null,
      website?.trim() || null,
      notes?.trim() || null,
      contact_type || 'contact',
      req.user.id
    ]);
    
    res.status(201).json({
      success: true,
      contact: result.rows[0],
      message: 'Contact added successfully'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact'
    });
  }
});

// Update directory entry
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contact_name,
      organization,
      title,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      website,
      notes,
      contact_type
    } = req.body;
    
    // Validate required fields
    if (!contact_name || contact_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Contact name is required'
      });
    }
    
    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }
    
    // Validate contact type
    const validTypes = ['contact', 'organization', 'vendor', 'sponsor', 'partner'];
    if (contact_type && !validTypes.includes(contact_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact type'
      });
    }
    
    const result = await db.query(`
      UPDATE directory SET
        contact_name = $1, organization = $2, title = $3, email = $4, phone = $5,
        address = $6, city = $7, state = $8, zip_code = $9, website = $10,
        notes = $11, contact_type = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      contact_name.trim(),
      organization?.trim() || null,
      title?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      address?.trim() || null,
      city?.trim() || null,
      state?.trim() || null,
      zip_code?.trim() || null,
      website?.trim() || null,
      notes?.trim() || null,
      contact_type || 'contact',
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact: result.rows[0],
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
});

// Delete directory entry
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM directory WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
});

module.exports = router; 