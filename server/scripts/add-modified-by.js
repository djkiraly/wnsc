const db = require('../config/database');

const addModifiedByField = async () => {
  try {
    console.log('🚀 Adding modified_by field to directory table...');

    // Add modified_by field to directory table
    await db.query(`
      ALTER TABLE directory 
      ADD COLUMN IF NOT EXISTS modified_by INTEGER REFERENCES users(id);
    `);

    // Create index for modified_by field
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_directory_modified_by ON directory(modified_by);
    `);

    // Add directory table to the updated_at trigger
    await db.query(`
      DROP TRIGGER IF EXISTS update_directory_updated_at ON directory;
      CREATE TRIGGER update_directory_updated_at
        BEFORE UPDATE ON directory
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Modified directory table successfully!');
    console.log('📊 Added modified_by field and updated_at trigger');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  addModifiedByField()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addModifiedByField };