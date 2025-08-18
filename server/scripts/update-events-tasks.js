const db = require('../config/database');

const updateEventsAndTasks = async () => {
  try {
    console.log('🚀 Updating Events and Tasks tables...');

    // Add modified_by field to events table
    await db.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS modified_by INTEGER REFERENCES users(id);
    `);

    // Create index for modified_by field
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_events_modified_by ON events(modified_by);
    `);

    // Make event_id NOT NULL for tasks (new tasks must be associated with events)
    // Note: This will fail if there are existing tasks without event_id
    // First check for existing tasks without event_id
    const orphanTasks = await db.query(`
      SELECT COUNT(*) as count FROM tasks WHERE event_id IS NULL
    `);

    if (orphanTasks.rows[0].count > 0) {
      console.log(`⚠️  Found ${orphanTasks.rows[0].count} tasks without event_id. These must be associated with events first.`);
      console.log('📝 Skipping NOT NULL constraint on event_id for now.');
    } else {
      // Only add NOT NULL constraint if no orphan tasks exist
      await db.query(`
        ALTER TABLE tasks 
        ALTER COLUMN event_id SET NOT NULL;
      `);
      console.log('✅ Made event_id required for new tasks');
    }

    // Add triggers for events table updated_at
    await db.query(`
      DROP TRIGGER IF EXISTS update_events_updated_at ON events;
      CREATE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Add modified_by field to tasks table
    await db.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS modified_by INTEGER REFERENCES users(id);
    `);

    // Create index for tasks modified_by field
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_modified_by ON tasks(modified_by);
    `);

    // Add triggers for tasks table updated_at (should already exist but let's ensure)
    await db.query(`
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Updated Events and Tasks tables successfully!');
    console.log('📊 Added modified_by fields and updated_at triggers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  updateEventsAndTasks()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { updateEventsAndTasks };