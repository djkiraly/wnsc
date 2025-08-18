const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Configure multer for CSV file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to validate contact data
const validateContactData = (contact, rowIndex) => {
  const errors = [];
  
  // Required field validation
  if (!contact.contact_name || contact.contact_name.trim() === '') {
    errors.push(`Row ${rowIndex}: Contact name is required`);
  }
  
  // Email validation
  if (contact.email && contact.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      errors.push(`Row ${rowIndex}: Invalid email format`);
    }
  }
  
  // Contact type validation
  const validTypes = ['contact', 'organization', 'vendor', 'sponsor', 'partner'];
  if (contact.contact_type && !validTypes.includes(contact.contact_type.toLowerCase())) {
    errors.push(`Row ${rowIndex}: Invalid contact type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return errors;
};

// Helper function to normalize CSV headers
const normalizeHeaders = (headers) => {
  const headerMap = {
    'name': 'contact_name',
    'contact name': 'contact_name',
    'full name': 'contact_name',
    'company': 'organization',
    'org': 'organization',
    'job title': 'title',
    'position': 'title',
    'email address': 'email',
    'phone number': 'phone',
    'telephone': 'phone',
    'street': 'address',
    'street address': 'address',
    'zip': 'zip_code',
    'postal code': 'zip_code',
    'url': 'website',
    'web': 'website',
    'type': 'contact_type',
    'category': 'contact_type'
  };
  
  return headers.map(header => {
    const normalized = header.toLowerCase().trim();
    return headerMap[normalized] || normalized.replace(/\s+/g, '_');
  });
};

// CSV Import endpoint
router.post('/import', requireAuth, upload.single('csvFile'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file provided'
      });
    }
    
    filePath = req.file.path;
    const contacts = [];
    const errors = [];
    let rowIndex = 0;
    
    // Parse CSV file
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => normalizeHeaders([header])[0]
        }))
        .on('data', (data) => {
          rowIndex++;
          
          // Clean and prepare contact data
          const contact = {
            contact_name: data.contact_name?.trim() || '',
            organization: data.organization?.trim() || null,
            title: data.title?.trim() || null,
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            state: data.state?.trim() || null,
            zip_code: data.zip_code?.trim() || null,
            website: data.website?.trim() || null,
            notes: data.notes?.trim() || null,
            contact_type: (data.contact_type?.trim() || 'contact').toLowerCase(),
            added_by: req.user.id
          };
          
          // Validate contact data
          const contactErrors = validateContactData(contact, rowIndex);
          if (contactErrors.length > 0) {
            errors.push(...contactErrors);
          } else {
            contacts.push(contact);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Check if there are validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found in CSV file',
        errors: errors,
        totalRows: rowIndex
      });
    }
    
    // Check for duplicate emails within the import
    const emailCounts = {};
    const duplicateEmails = [];
    contacts.forEach((contact, index) => {
      if (contact.email) {
        emailCounts[contact.email] = (emailCounts[contact.email] || 0) + 1;
        if (emailCounts[contact.email] > 1) {
          duplicateEmails.push(`Duplicate email "${contact.email}" found in import data`);
        }
      }
    });
    
    if (duplicateEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate emails found in import data',
        errors: duplicateEmails
      });
    }
    
    // Check for existing contacts with same email in database
    if (contacts.some(c => c.email)) {
      const existingEmails = contacts
        .filter(c => c.email)
        .map(c => c.email);
      
      const existingQuery = `
        SELECT email FROM directory 
        WHERE email = ANY($1::text[])
      `;
      const existingResult = await db.query(existingQuery, [existingEmails]);
      
      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows.map(row => row.email);
        return res.status(400).json({
          success: false,
          message: 'Some contacts already exist in the database',
          errors: existing.map(email => `Contact with email "${email}" already exists`),
          existingEmails: existing
        });
      }
    }
    
    // Insert contacts into database
    const insertedContacts = [];
    
    for (const contact of contacts) {
      const result = await db.query(`
        INSERT INTO directory (
          contact_name, organization, title, email, phone, address, city, state, 
          zip_code, website, notes, contact_type, added_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        contact.contact_name,
        contact.organization,
        contact.title,
        contact.email,
        contact.phone,
        contact.address,
        contact.city,
        contact.state,
        contact.zip_code,
        contact.website,
        contact.notes,
        contact.contact_type,
        contact.added_by
      ]);
      
      insertedContacts.push(result.rows[0]);
    }
    
    res.json({
      success: true,
      message: `Successfully imported ${insertedContacts.length} contacts`,
      importedCount: insertedContacts.length,
      totalRows: rowIndex,
      contacts: insertedContacts
    });
    
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import CSV file',
      error: error.message
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
  }
});

// Get CSV template endpoint
router.get('/import/template', requireAuth, (req, res) => {
  const template = [
    'contact_name,organization,title,email,phone,address,city,state,zip_code,website,notes,contact_type',
    'John Doe,ACME Corp,Manager,john@acme.com,(555) 123-4567,123 Main St,Anytown,NE,12345,https://acme.com,Sample contact,contact',
    'Jane Smith,Tech Solutions,Developer,jane@tech.com,(555) 987-6543,456 Oak Ave,Tech City,NE,67890,https://techsolutions.com,Another sample,organization'
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="directory_import_template.csv"');
  res.send(template);
});

// Get all directory entries
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, type } = req.query;
    
    let query = `
      SELECT d.*, 
        u.first_name as added_by_first_name, u.last_name as added_by_last_name,
        m.first_name as modified_by_first_name, m.last_name as modified_by_last_name
      FROM directory d
      LEFT JOIN users u ON d.added_by = u.id
      LEFT JOIN users m ON d.modified_by = m.id
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
      SELECT d.*, 
        u.first_name as added_by_first_name, u.last_name as added_by_last_name,
        m.first_name as modified_by_first_name, m.last_name as modified_by_last_name
      FROM directory d
      LEFT JOIN users u ON d.added_by = u.id
      LEFT JOIN users m ON d.modified_by = m.id
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
        notes = $11, contact_type = $12, modified_by = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
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
      req.user.id,
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