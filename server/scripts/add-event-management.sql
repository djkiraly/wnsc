-- Add tables for event management dashboard functionality

-- Event Notes table
CREATE TABLE IF NOT EXISTS event_notes (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'important', 'reminder', 'warning')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES users(id)
);

-- Event Contacts table
CREATE TABLE IF NOT EXISTS event_contacts (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    organization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    contact_type VARCHAR(50) DEFAULT 'general' CHECK (contact_type IN ('organizer', 'venue', 'sponsor', 'vendor', 'volunteer', 'participant', 'media', 'general')),
    is_primary BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_notes_event_id ON event_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notes_created_by ON event_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_event_notes_note_type ON event_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_event_contacts_event_id ON event_contacts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contacts_created_by ON event_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_event_contacts_contact_type ON event_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_event_contacts_is_primary ON event_contacts(is_primary);

-- Add trigger to update updated_at timestamp for event_notes
CREATE OR REPLACE FUNCTION update_event_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_notes_updated_at
    BEFORE UPDATE ON event_notes
    FOR EACH ROW EXECUTE FUNCTION update_event_notes_updated_at();

-- Add trigger to update updated_at timestamp for event_contacts
CREATE OR REPLACE FUNCTION update_event_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_contacts_updated_at
    BEFORE UPDATE ON event_contacts
    FOR EACH ROW EXECUTE FUNCTION update_event_contacts_updated_at();

-- Insert sample data (optional)
-- INSERT INTO event_notes (event_id, title, content, note_type, created_by) 
-- VALUES (1, 'Setup Reminder', 'Remember to set up registration table 1 hour before event', 'reminder', 1);

-- INSERT INTO event_contacts (event_id, name, role, organization, email, phone, contact_type, is_primary, created_by)
-- VALUES (1, 'John Smith', 'Event Coordinator', 'Sports Council', 'john@example.com', '555-0123', 'organizer', true, 1);