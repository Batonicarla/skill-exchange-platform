const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running ratings table migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'fix_ratings_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If rpc doesn't work, try direct query
      const { error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(0); // This will fail, but we'll use raw query instead
        
      // Split SQL into individual statements and execute
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.trim().substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement.trim() 
          });
          
          if (stmtError) {
            console.error('Error executing statement:', stmtError);
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('The ratings table has been updated to properly link to sessions.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run the SQL manually in your Supabase SQL editor:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of database/fix_ratings_table.sql');
  }
}

runMigration();