-- Add modified_by field to directory table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'directory' AND column_name = 'modified_by'
    ) THEN
        ALTER TABLE directory ADD COLUMN modified_by INTEGER REFERENCES users(id);
    END IF;
END $$;

-- Add trigger to update updated_at timestamp for directory
CREATE OR REPLACE FUNCTION update_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_directory_updated_at ON directory;
CREATE TRIGGER trigger_directory_updated_at
    BEFORE UPDATE ON directory
    FOR EACH ROW EXECUTE FUNCTION update_directory_updated_at();