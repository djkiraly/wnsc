const express = require('express');
const { requireAuth, requireOrganizer } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Get all tasks
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, priority, assigned_to, event_id } = req.query;
    
    let query = `
      SELECT t.*, e.title as event_title,
             u1.first_name as assigned_to_first_name, u1.last_name as assigned_to_last_name,
             u2.first_name as created_by_first_name, u2.last_name as created_by_last_name,
             u3.first_name as modified_by_first_name, u3.last_name as modified_by_last_name
      FROM tasks t
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN users u3 ON t.modified_by = u3.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      query += ` AND t.priority = $${params.length}`;
    }

    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND t.assigned_to = $${params.length}`;
    }

    if (event_id) {
      params.push(event_id);
      query += ` AND t.event_id = $${params.length}`;
    }

    query += ` ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC`;

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      tasks: result.rows
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Get single task
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT t.*, e.title as event_title,
             u1.first_name as assigned_to_first_name, u1.last_name as assigned_to_last_name,
             u2.first_name as created_by_first_name, u2.last_name as created_by_last_name,
             u3.first_name as modified_by_first_name, u3.last_name as modified_by_last_name
      FROM tasks t
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN users u3 ON t.modified_by = u3.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// Create new task
router.post('/', requireOrganizer, async (req, res) => {
  try {
    const {
      title, description, priority, due_date, assigned_to, event_id
    } = req.body;

    // Validate that event_id is provided
    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required - tasks must be associated with an event'
      });
    }

    // Verify the event exists
    const eventCheck = await db.query('SELECT id FROM events WHERE id = $1', [event_id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const result = await db.query(`
      INSERT INTO tasks (title, description, priority, due_date, assigned_to, 
                        created_by, event_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [
      title, description, priority, due_date, assigned_to,
      req.user.id, event_id
    ]);

    res.status(201).json({
      success: true,
      task: result.rows[0],
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, priority, status, due_date, assigned_to
    } = req.body;

    // Check if user can update this task
    const taskCheck = await db.query(`
      SELECT * FROM tasks 
      WHERE id = $1 AND (assigned_to = $2 OR created_by = $2)
    `, [id, req.user.id]);

    // Allow organizers and admins to update any task
    if (taskCheck.rows.length === 0 && !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const completed_at = status === 'completed' ? 'CURRENT_TIMESTAMP' : null;

    const result = await db.query(`
      UPDATE tasks 
      SET title = $1, description = $2, priority = $3, status = $4, 
          due_date = $5, assigned_to = $6, modified_by = $7, updated_at = CURRENT_TIMESTAMP,
          completed_at = ${completed_at ? completed_at : 'NULL'}
      WHERE id = $8
      RETURNING *
    `, [
      title, description, priority, status, due_date, assigned_to, req.user.id, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task: result.rows[0],
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Delete task
router.delete('/:id', requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM tasks WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// Update task status only
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if user can update this task
    const taskCheck = await db.query(`
      SELECT * FROM tasks 
      WHERE id = $1 AND (assigned_to = $2 OR created_by = $2)
    `, [id, req.user.id]);

    if (taskCheck.rows.length === 0 && !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const completed_at = status === 'completed' ? 'CURRENT_TIMESTAMP' : null;

    const result = await db.query(`
      UPDATE tasks 
      SET status = $1, modified_by = $2, updated_at = CURRENT_TIMESTAMP,
          completed_at = ${completed_at ? completed_at : 'NULL'}
      WHERE id = $3
      RETURNING *
    `, [status, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task: result.rows[0],
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

module.exports = router;