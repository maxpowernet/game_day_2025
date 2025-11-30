// Script to reset user password in Supabase Auth
// Run: node scripts/reset_user_password.cjs

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vhphsaodwurjnwrnxflm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function resetPassword() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to reset passwords');
    console.log('\nSet it in your .env file or as environment variable:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = 'max.eldon@gmail.com';
  const newPassword = '123456';

  console.log('🔄 Resetting password for:', email);

  try {
    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error('❌ User not found:', email);
      console.log('\n📝 Available users:');
      users.users.forEach(u => console.log('  -', u.email));
      process.exit(1);
    }

    console.log('✅ User found. ID:', user.id);

    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Error updating password:', error.message);
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

resetPassword();
