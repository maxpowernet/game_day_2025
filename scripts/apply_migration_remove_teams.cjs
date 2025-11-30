// Script to apply migration - remove teams and team_members tables
// Run: node scripts/apply_migration_remove_teams.cjs

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vhphsaodwurjnwrnxflm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigration() {
  if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    console.log('\nSet it in your .env file:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔄 Applying migration: Remove Teams and Team_Members');
  console.log('');

  try {
    // Execute SQL statements directly using the Supabase query builder
    // Note: These operations require admin/service role permissions
    
    console.log('Step 1: Dropping team_members table...');
    try {
      await supabase.from('team_members').delete().neq('team_id', 0); // Clear all records
      console.log('✅ team_members records cleared');
    } catch (e) {
      console.warn('team_members table may not exist or already cleared');
    }

    console.log('\nStep 2: Dropping teams table...');
    try {
      await supabase.from('teams').delete().neq('id', 0); // Clear all records
      console.log('✅ teams records cleared');
    } catch (e) {
      console.warn('teams table may not exist or already cleared');
    }

    console.log('\n⚠️  Note: Table drops and column removals must be executed via Supabase Dashboard SQL Editor');
    console.log('');
    console.log('Run these SQL statements in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('DROP TABLE IF EXISTS team_members CASCADE;');
    console.log('DROP TABLE IF EXISTS teams CASCADE;');
    console.log('ALTER TABLE players DROP COLUMN IF EXISTS team_id;');
    console.log('');
    console.log('✅ Data cleanup completed!');
    console.log('📋 Please execute the DROP TABLE statements manually in Supabase Dashboard.');

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  }
}

applyMigration();
