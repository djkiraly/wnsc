const express = require('express');
const { google } = require('googleapis');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Gmail OAuth2 client setup
const getGmailOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings/gmail/callback`
  );
};

// Get all system settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, 
        u.first_name as created_by_first_name, u.last_name as created_by_last_name,
        m.first_name as modified_by_first_name, m.last_name as modified_by_last_name
      FROM system_settings s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN users m ON s.modified_by = m.id
      ORDER BY s.setting_key
    `);
    
    res.json({
      success: true,
      settings: result.rows
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

// Get specific setting
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await db.query(`
      SELECT * FROM system_settings WHERE setting_key = $1
    `, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      setting: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

// Update system setting
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    const result = await db.query(`
      UPDATE system_settings 
      SET setting_value = $1, description = $2, modified_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = $4
      RETURNING *
    `, [value, description, req.user.id, key]);
    
    if (result.rows.length === 0) {
      // Create new setting if it doesn't exist
      const createResult = await db.query(`
        INSERT INTO system_settings (setting_key, setting_value, description, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [key, value, description, req.user.id]);
      
      return res.json({
        success: true,
        setting: createResult.rows[0],
        message: 'Setting created successfully'
      });
    }
    
    res.json({
      success: true,
      setting: result.rows[0],
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

// Gmail OAuth2 flow - Get authorization URL
router.get('/gmail/auth', requireAdmin, (req, res) => {
  try {
    const oauth2Client = getGmailOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    
    res.json({
      success: true,
      authUrl: url
    });
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL'
    });
  }
});

// Gmail OAuth2 callback handler
router.post('/gmail/callback', requireAdmin, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }
    
    const oauth2Client = getGmailOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info to get email address
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const userEmail = userInfo.data.email;
    
    // Store or update credentials in database
    await db.query(`
      INSERT INTO gmail_credentials (email, access_token, refresh_token, token_expiry, scope, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        scope = EXCLUDED.scope,
        updated_at = CURRENT_TIMESTAMP,
        is_active = true
    `, [
      userEmail,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      tokens.scope,
      req.user.id
    ]);
    
    // Enable Gmail integration setting
    await db.query(`
      UPDATE system_settings 
      SET setting_value = 'true', modified_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'gmail_integration_enabled'
    `, [req.user.id]);
    
    res.json({
      success: true,
      message: 'Gmail integration configured successfully',
      email: userEmail
    });
  } catch (error) {
    console.error('Error handling Gmail OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure Gmail integration'
    });
  }
});

// Get Gmail integration status
router.get('/gmail/status', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.*, s.setting_value as integration_enabled
      FROM gmail_credentials g
      CROSS JOIN system_settings s
      WHERE g.is_active = true AND s.setting_key = 'gmail_integration_enabled'
      ORDER BY g.created_at DESC
      LIMIT 1
    `);
    
    const integrationEnabled = await db.query(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'gmail_integration_enabled'
    `);
    
    res.json({
      success: true,
      isConfigured: result.rows.length > 0,
      isEnabled: integrationEnabled.rows[0]?.setting_value === 'true',
      credentials: result.rows[0] ? {
        email: result.rows[0].email,
        created_at: result.rows[0].created_at,
        token_expiry: result.rows[0].token_expiry
      } : null
    });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Gmail status'
    });
  }
});

// Disconnect Gmail integration
router.delete('/gmail/disconnect', requireAdmin, async (req, res) => {
  try {
    await db.query(`
      UPDATE gmail_credentials SET is_active = false WHERE is_active = true
    `);
    
    await db.query(`
      UPDATE system_settings 
      SET setting_value = 'false', modified_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'gmail_integration_enabled'
    `, [req.user.id]);
    
    res.json({
      success: true,
      message: 'Gmail integration disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Gmail integration'
    });
  }
});

// Email Templates CRUD

// Get all email templates
router.get('/email-templates', requireAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT et.*, 
        u.first_name as created_by_first_name, u.last_name as created_by_last_name,
        m.first_name as modified_by_first_name, m.last_name as modified_by_last_name
      FROM email_templates et
      LEFT JOIN users u ON et.created_by = u.id
      LEFT JOIN users m ON et.modified_by = m.id
    `;
    
    const params = [];
    
    if (type && type !== 'all') {
      query += ` WHERE et.template_type = $1`;
      params.push(type);
    }
    
    query += ` ORDER BY et.template_type, et.name`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates'
    });
  }
});

// Create email template
router.post('/email-templates', requireAdmin, async (req, res) => {
  try {
    const {
      name, subject, body_text, body_html, template_type, variables
    } = req.body;
    
    const result = await db.query(`
      INSERT INTO email_templates 
      (name, subject, body_text, body_html, template_type, variables, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, subject, body_text, body_html, template_type, JSON.stringify(variables), req.user.id]);
    
    res.status(201).json({
      success: true,
      template: result.rows[0],
      message: 'Email template created successfully'
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email template'
    });
  }
});

// Update email template
router.put('/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, subject, body_text, body_html, template_type, variables, is_active
    } = req.body;
    
    const result = await db.query(`
      UPDATE email_templates 
      SET name = $1, subject = $2, body_text = $3, body_html = $4, 
          template_type = $5, variables = $6, is_active = $7, 
          modified_by = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [name, subject, body_text, body_html, template_type, JSON.stringify(variables), is_active, req.user.id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    res.json({
      success: true,
      template: result.rows[0],
      message: 'Email template updated successfully'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template'
    });
  }
});

// Delete email template
router.delete('/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM email_templates WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email template'
    });
  }
});

// Get email logs (for monitoring sent emails)
router.get('/email-logs', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = `
      SELECT el.*, 
        u.first_name as sent_by_first_name, u.last_name as sent_by_last_name,
        et.name as template_name
      FROM email_logs el
      LEFT JOIN users u ON el.sent_by = u.id
      LEFT JOIN email_templates et ON el.template_id = et.id
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ` WHERE el.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY el.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    const countQuery = status && status !== 'all' ? 
      'SELECT COUNT(*) FROM email_logs WHERE status = $1' : 
      'SELECT COUNT(*) FROM email_logs';
    const countParams = status && status !== 'all' ? [status] : [];
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      success: true,
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs'
    });
  }
});

module.exports = router;