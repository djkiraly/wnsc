const express = require('express');
const { requireAuth, requireOrganizer } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, type, upcoming } = req.query;
    let query = `
      SELECT e.*, 
             u.first_name as created_by_first_name, 
             u.last_name as created_by_last_name,
             m.first_name as modified_by_first_name,
             m.last_name as modified_by_last_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users m ON e.modified_by = m.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND e.event_type = $${params.length}`;
    }

    if (upcoming === 'true') {
      query += ` AND e.start_date > NOW()`;
    }

    query += ` ORDER BY e.start_date ASC`;

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      events: result.rows
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get event details
    const eventResult = await db.query(`
      SELECT e.*, 
             u.first_name as created_by_first_name, 
             u.last_name as created_by_last_name,
             m.first_name as modified_by_first_name,
             m.last_name as modified_by_last_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users m ON e.modified_by = m.id
      WHERE e.id = $1
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get event participants
    const participantsResult = await db.query(`
      SELECT ep.*, u.first_name, u.last_name, u.email, u.organization
      FROM event_participants ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = $1
      ORDER BY ep.registration_date ASC
    `, [id]);

    // Get event tasks
    const tasksResult = await db.query(`
      SELECT t.*, 
             u1.first_name as assigned_to_first_name, u1.last_name as assigned_to_last_name,
             u2.first_name as created_by_first_name, u2.last_name as created_by_last_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.event_id = $1
      ORDER BY t.due_date ASC, t.priority DESC
    `, [id]);

    const event = eventResult.rows[0];
    event.participants = participantsResult.rows;
    event.tasks = tasksResult.rows;

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// Create new event
router.post('/', requireOrganizer, async (req, res) => {
  try {
    const {
      title, description, event_type, location, venue_details,
      start_date, end_date, registration_deadline, max_participants
    } = req.body;

    const result = await db.query(`
      INSERT INTO events (title, description, event_type, location, venue_details,
                         start_date, end_date, registration_deadline, max_participants,
                         created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *
    `, [
      title, description, event_type, location, venue_details,
      start_date, end_date, registration_deadline, max_participants,
      req.user.id
    ]);

    res.status(201).json({
      success: true,
      event: result.rows[0],
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// Update event
router.put('/:id', requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, event_type, location, venue_details,
      start_date, end_date, registration_deadline, max_participants, status
    } = req.body;

    const result = await db.query(`
      UPDATE events 
      SET title = $1, description = $2, event_type = $3, location = $4, 
          venue_details = $5, start_date = $6, end_date = $7, 
          registration_deadline = $8, max_participants = $9, status = $10,
          modified_by = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      title, description, event_type, location, venue_details,
      start_date, end_date, registration_deadline, max_participants, status,
      req.user.id, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event: result.rows[0],
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Register for event
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if user already registered
    const existingRegistration = await db.query(`
      SELECT * FROM event_participants 
      WHERE event_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (existingRegistration.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Check event capacity
    const eventResult = await db.query(`
      SELECT max_participants, current_participants 
      FROM events 
      WHERE id = $1 AND status = 'published'
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not available for registration'
      });
    }

    const event = eventResult.rows[0];
    if (event.max_participants && event.current_participants >= event.max_participants) {
      return res.status(409).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Register user
    await db.query(`
      INSERT INTO event_participants (event_id, user_id, notes)
      VALUES ($1, $2, $3)
    `, [id, req.user.id, notes]);

    // Update participant count
    await db.query(`
      UPDATE events 
      SET current_participants = current_participants + 1
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event'
    });
  }
});

// Unregister from event
router.delete('/:id/register', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM event_participants 
      WHERE event_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update participant count
    await db.query(`
      UPDATE events 
      SET current_participants = current_participants - 1
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister from event'
    });
  }
});

// Event Notes Routes

// Get event notes
router.get('/:id/notes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT en.*, 
             u.first_name as created_by_first_name, 
             u.last_name as created_by_last_name,
             m.first_name as modified_by_first_name,
             m.last_name as modified_by_last_name
      FROM event_notes en
      LEFT JOIN users u ON en.created_by = u.id
      LEFT JOIN users m ON en.modified_by = m.id
      WHERE en.event_id = $1
      ORDER BY en.created_at DESC
    `, [id]);

    res.json({
      success: true,
      notes: result.rows
    });
  } catch (error) {
    console.error('Error fetching event notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event notes'
    });
  }
});

// Create event note
router.post('/:id/notes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, note_type = 'general' } = req.body;

    const result = await db.query(`
      INSERT INTO event_notes (event_id, title, content, note_type, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, title, content, note_type, req.user.id]);

    res.status(201).json({
      success: true,
      note: result.rows[0],
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating event note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event note'
    });
  }
});

// Update event note
router.put('/:id/notes/:noteId', requireAuth, async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { title, content, note_type } = req.body;

    const result = await db.query(`
      UPDATE event_notes 
      SET title = $1, content = $2, note_type = $3, modified_by = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND event_id = $6
      RETURNING *
    `, [title, content, note_type, req.user.id, noteId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating event note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event note'
    });
  }
});

// Delete event note
router.delete('/:id/notes/:noteId', requireAuth, async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const result = await db.query(`
      DELETE FROM event_notes 
      WHERE id = $1 AND event_id = $2
    `, [noteId, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event note'
    });
  }
});

// Event Contacts Routes

// Get event contacts
router.get('/:id/contacts', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT ec.*, 
             u.first_name as created_by_first_name, 
             u.last_name as created_by_last_name,
             m.first_name as modified_by_first_name,
             m.last_name as modified_by_last_name
      FROM event_contacts ec
      LEFT JOIN users u ON ec.created_by = u.id
      LEFT JOIN users m ON ec.modified_by = m.id
      WHERE ec.event_id = $1
      ORDER BY ec.is_primary DESC, ec.contact_type, ec.name
    `, [id]);

    res.json({
      success: true,
      contacts: result.rows
    });
  } catch (error) {
    console.error('Error fetching event contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event contacts'
    });
  }
});

// Create event contact
router.post('/:id/contacts', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, role, organization, email, phone, address, notes, 
      contact_type = 'general', is_primary = false 
    } = req.body;

    // Start a transaction
    await db.query('BEGIN');

    try {
      // If setting as primary, unset other primary contacts of same type
      if (is_primary) {
        await db.query(`
          UPDATE event_contacts 
          SET is_primary = false 
          WHERE event_id = $1 AND contact_type = $2
        `, [id, contact_type]);
      }

      // Create the event contact
      const contactResult = await db.query(`
        INSERT INTO event_contacts 
        (event_id, name, role, organization, email, phone, address, notes, contact_type, is_primary, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [id, name, role, organization, email, phone, address, notes, contact_type, is_primary, req.user.id]);

      const eventContact = contactResult.rows[0];

      // Check if this contact already exists in directory (by email if provided, otherwise by name and organization)
      let existingDirectoryContact = null;
      
      if (email && email.trim()) {
        // Check by email first (most reliable)
        const emailCheck = await db.query(`
          SELECT * FROM directory WHERE email = $1
        `, [email.trim()]);
        existingDirectoryContact = emailCheck.rows[0];
      }
      
      if (!existingDirectoryContact) {
        // Check by name and organization combination
        const nameOrgCheck = await db.query(`
          SELECT * FROM directory 
          WHERE contact_name = $1 AND (
            (organization = $2 AND organization IS NOT NULL) OR 
            (organization IS NULL AND $2 IS NULL)
          )
        `, [name.trim(), organization?.trim() || null]);
        existingDirectoryContact = nameOrgCheck.rows[0];
      }

      let directoryContact = existingDirectoryContact;
      
      // If no existing directory entry found, create one
      if (!existingDirectoryContact) {
        // Map event contact types to directory contact types
        const directoryContactType = mapEventContactTypeToDirectory(contact_type);
        
        const directoryResult = await db.query(`
          INSERT INTO directory 
          (contact_name, organization, title, email, phone, address, notes, contact_type, added_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          name.trim(),
          organization?.trim() || null,
          role?.trim() || null, // role maps to title in directory
          email?.trim() || null,
          phone?.trim() || null,
          address?.trim() || null,
          notes?.trim() || null,
          directoryContactType,
          req.user.id
        ]);
        
        directoryContact = directoryResult.rows[0];
      }

      // Commit the transaction
      await db.query('COMMIT');

      res.status(201).json({
        success: true,
        contact: eventContact,
        directoryEntry: directoryContact,
        isNewDirectoryEntry: !existingDirectoryContact,
        message: existingDirectoryContact ? 
          'Contact created successfully and linked to existing directory entry' :
          'Contact created successfully and added to directory'
      });
      
    } catch (error) {
      // Rollback the transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating event contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event contact'
    });
  }
});

// Helper function to map event contact types to directory contact types
function mapEventContactTypeToDirectory(eventContactType) {
  const mapping = {
    'organizer': 'contact',
    'venue': 'organization',
    'sponsor': 'sponsor',
    'vendor': 'vendor',
    'volunteer': 'contact',
    'participant': 'contact',
    'media': 'organization',
    'general': 'contact'
  };
  return mapping[eventContactType] || 'contact';
}

// Update event contact
router.put('/:id/contacts/:contactId', requireAuth, async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const { 
      name, role, organization, email, phone, address, notes, 
      contact_type, is_primary 
    } = req.body;

    // Start a transaction
    await db.query('BEGIN');

    try {
      // Get the original contact to check if we need to update directory
      const originalContactResult = await db.query(`
        SELECT * FROM event_contacts WHERE id = $1 AND event_id = $2
      `, [contactId, id]);

      if (originalContactResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      const originalContact = originalContactResult.rows[0];

      // If setting as primary, unset other primary contacts of same type
      if (is_primary) {
        await db.query(`
          UPDATE event_contacts 
          SET is_primary = false 
          WHERE event_id = $1 AND contact_type = $2 AND id != $3
        `, [id, contact_type, contactId]);
      }

      // Update the event contact
      const contactResult = await db.query(`
        UPDATE event_contacts 
        SET name = $1, role = $2, organization = $3, email = $4, phone = $5, 
            address = $6, notes = $7, contact_type = $8, is_primary = $9, 
            modified_by = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND event_id = $12
        RETURNING *
      `, [name, role, organization, email, phone, address, notes, contact_type, is_primary, req.user.id, contactId, id]);

      const updatedContact = contactResult.rows[0];

      // Try to find and update corresponding directory entry
      let directoryContact = null;
      let directoryAction = 'none';

      // First, try to find existing directory entry by email (if both old and new have emails)
      if (originalContact.email && email) {
        const emailCheck = await db.query(`
          SELECT * FROM directory WHERE email = $1
        `, [originalContact.email.trim()]);
        directoryContact = emailCheck.rows[0];
      }

      // If not found by email, try by name and organization
      if (!directoryContact) {
        const nameOrgCheck = await db.query(`
          SELECT * FROM directory 
          WHERE contact_name = $1 AND (
            (organization = $2 AND organization IS NOT NULL) OR 
            (organization IS NULL AND $2 IS NULL)
          )
        `, [originalContact.name.trim(), originalContact.organization?.trim() || null]);
        directoryContact = nameOrgCheck.rows[0];
      }

      if (directoryContact) {
        // Update existing directory entry
        const directoryContactType = mapEventContactTypeToDirectory(contact_type);
        
        const updatedDirectoryResult = await db.query(`
          UPDATE directory 
          SET contact_name = $1, organization = $2, title = $3, email = $4, phone = $5, 
              address = $6, notes = $7, contact_type = $8, modified_by = $9, updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *
        `, [
          name.trim(),
          organization?.trim() || null,
          role?.trim() || null,
          email?.trim() || null,
          phone?.trim() || null,
          address?.trim() || null,
          notes?.trim() || null,
          directoryContactType,
          req.user.id,
          directoryContact.id
        ]);
        
        directoryContact = updatedDirectoryResult.rows[0];
        directoryAction = 'updated';
      } else if (email && email.trim()) {
        // If we have an email but couldn't find existing directory entry, create new one
        const directoryContactType = mapEventContactTypeToDirectory(contact_type);
        
        const newDirectoryResult = await db.query(`
          INSERT INTO directory 
          (contact_name, organization, title, email, phone, address, notes, contact_type, added_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          name.trim(),
          organization?.trim() || null,
          role?.trim() || null,
          email.trim(),
          phone?.trim() || null,
          address?.trim() || null,
          notes?.trim() || null,
          directoryContactType,
          req.user.id
        ]);
        
        directoryContact = newDirectoryResult.rows[0];
        directoryAction = 'created';
      }

      // Commit the transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        contact: updatedContact,
        directoryEntry: directoryContact,
        directoryAction,
        message: `Contact updated successfully${directoryContact ? ` and directory entry ${directoryAction}` : ''}`
      });
      
    } catch (error) {
      // Rollback the transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating event contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event contact'
    });
  }
});

// Delete event contact
router.delete('/:id/contacts/:contactId', requireAuth, async (req, res) => {
  try {
    const { id, contactId } = req.params;

    const result = await db.query(`
      DELETE FROM event_contacts 
      WHERE id = $1 AND event_id = $2
    `, [contactId, id]);

    if (result.rowCount === 0) {
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
    console.error('Error deleting event contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event contact'
    });
  }
});

module.exports = router;