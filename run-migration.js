const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in backend/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Check if completed_at column already exists
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'sessions')
      .eq('column_name', 'completed_at');
    
    if (columns && columns.length > 0) {
      console.log('Migration already applied - completed_at column exists');
      return;
    }
    
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n--- Migration SQL ---');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database', 'add_completed_status.sql'), 
      'utf8'
    );
    
    console.log(migrationSQL);
    console.log('--- End Migration SQL ---\n');
    
    console.log('After running the SQL, the migration will be complete.');
    console.log('Changes:');
    console.log('- Added completed_at field to sessions table');
    console.log('- Updated status constraint to include "completed"');
    
  } catch (error) {
    console.error('Error checking migration status:', error);
    process.exit(1);
  }
}

runMigration();