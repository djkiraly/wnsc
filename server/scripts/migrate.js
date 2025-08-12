const db = require('../config/database');

const createTables = async () => {
  try {
    console.log('🚀 Starting database migration...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        profile_picture VARCHAR(500),
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'organizer', 'member')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        phone VARCHAR(20),
        organization VARCHAR(100),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_sessions table for session storage
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      ) WITH (OIDS=FALSE);
    `);

    await db.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire);
    `);

    // Create events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('tournament', 'meeting', 'training', 'social', 'general')),
        location VARCHAR(200),
        venue_details TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        registration_deadline TIMESTAMP,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tasks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        due_date TIMESTAMP,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create event_participants table (many-to-many relationship)
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
        notes TEXT,
        UNIQUE(event_id, user_id)
      );
    `);

    // Create notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'event', 'task', 'system')),
        is_read BOOLEAN DEFAULT FALSE,
        related_id INTEGER,
        related_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create updated_at trigger function
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    const tables = ['users', 'events', 'tasks'];
    for (const table of tables) {
      await db.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    // Create directory table for contacts and organizations
    await db.query(`
      CREATE TABLE IF NOT EXISTS directory (
        id SERIAL PRIMARY KEY,
        contact_name VARCHAR(200) NOT NULL,
        organization VARCHAR(200),
        title VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        website VARCHAR(500),
        notes TEXT,
        contact_type VARCHAR(50) DEFAULT 'contact' CHECK (contact_type IN ('contact', 'organization', 'vendor', 'sponsor', 'partner')),
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for directory table
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_directory_contact_name ON directory(contact_name);
      CREATE INDEX IF NOT EXISTS idx_directory_organization ON directory(organization);
      CREATE INDEX IF NOT EXISTS idx_directory_contact_type ON directory(contact_type);
      CREATE INDEX IF NOT EXISTS idx_directory_added_by ON directory(added_by);
    `);

    console.log('✅ Database migration completed successfully!');
    console.log('📊 Created tables: users, events, tasks, event_participants, notifications, user_sessions, directory');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };