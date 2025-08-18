-- Add tables for email system settings and Gmail integration

-- System settings table for email configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES users(id)
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    template_type VARCHAR(50) DEFAULT 'general' CHECK (template_type IN ('general', 'event', 'task', 'notification', 'welcome')),
    variables JSON, -- Store template variables as JSON
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES users(id)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(200) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    template_id INTEGER REFERENCES email_templates(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'queued')),
    error_message TEXT,
    message_id VARCHAR(255),
    sent_at TIMESTAMP,
    related_type VARCHAR(50), -- 'event', 'task', 'user', etc.
    related_id INTEGER,
    sent_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gmail OAuth tokens (encrypted storage)
CREATE TABLE IF NOT EXISTS gmail_credentials (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP,
    scope TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_related ON email_logs(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_gmail_credentials_email ON gmail_credentials(email);
CREATE INDEX IF NOT EXISTS idx_gmail_credentials_active ON gmail_credentials(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_email_settings_updated_at();

CREATE TRIGGER trigger_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_settings_updated_at();

CREATE TRIGGER trigger_gmail_credentials_updated_at
    BEFORE UPDATE ON gmail_credentials
    FOR EACH ROW EXECUTE FUNCTION update_email_settings_updated_at();

-- Insert default email settings
INSERT INTO system_settings (setting_key, setting_value, description, created_by) 
VALUES 
    ('email_enabled', 'false', 'Enable or disable email functionality', 1),
    ('gmail_integration_enabled', 'false', 'Enable Gmail API integration', 1),
    ('default_from_name', 'West Nebraska Sports Council', 'Default sender name for emails', 1),
    ('email_signature', '', 'Default email signature', 1),
    ('max_daily_emails', '100', 'Maximum emails per day limit', 1)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_text, body_html, template_type, variables, created_by)
VALUES 
    (
        'Event Registration Confirmation',
        'Registration Confirmed: {{event_title}}',
        'Hello {{user_name}},

Your registration for "{{event_title}}" has been confirmed.

Event Details:
- Date: {{event_date}}
- Time: {{event_time}}
- Location: {{event_location}}

Thank you for registering!

Best regards,
West Nebraska Sports Council',
        '<h2>Registration Confirmed</h2>
<p>Hello {{user_name}},</p>
<p>Your registration for "<strong>{{event_title}}</strong>" has been confirmed.</p>
<h3>Event Details:</h3>
<ul>
<li><strong>Date:</strong> {{event_date}}</li>
<li><strong>Time:</strong> {{event_time}}</li>
<li><strong>Location:</strong> {{event_location}}</li>
</ul>
<p>Thank you for registering!</p>
<p>Best regards,<br>West Nebraska Sports Council</p>',
        'event',
        '{"user_name": "User name", "event_title": "Event title", "event_date": "Event date", "event_time": "Event time", "event_location": "Event location"}',
        1
    ),
    (
        'Task Assignment Notification',
        'New Task Assigned: {{task_title}}',
        'Hello {{assignee_name}},

You have been assigned a new task: "{{task_title}}"

Task Details:
- Description: {{task_description}}
- Priority: {{task_priority}}
- Due Date: {{due_date}}
- Event: {{event_title}}

Please log in to the system to view more details.

Best regards,
West Nebraska Sports Council',
        '<h2>New Task Assignment</h2>
<p>Hello {{assignee_name}},</p>
<p>You have been assigned a new task: "<strong>{{task_title}}</strong>"</p>
<h3>Task Details:</h3>
<ul>
<li><strong>Description:</strong> {{task_description}}</li>
<li><strong>Priority:</strong> {{task_priority}}</li>
<li><strong>Due Date:</strong> {{due_date}}</li>
<li><strong>Event:</strong> {{event_title}}</li>
</ul>
<p>Please log in to the system to view more details.</p>
<p>Best regards,<br>West Nebraska Sports Council</p>',
        'task',
        '{"assignee_name": "Assignee name", "task_title": "Task title", "task_description": "Task description", "task_priority": "Priority level", "due_date": "Due date", "event_title": "Related event"}',
        1
    )
ON CONFLICT DO NOTHING;