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
             u.last_name as created_by_last_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
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
             u.last_name as created_by_last_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
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
          registration_deadline = $8, max_participants = $9, status = $10
      WHERE id = $11
      RETURNING *
    `, [
      title, description, event_type, location, venue_details,
      start_date, end_date, registration_deadline, max_participants, status, id
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

module.exports = router;