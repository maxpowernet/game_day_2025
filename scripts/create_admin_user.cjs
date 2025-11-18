// Script to create admin user in Supabase Auth
// Run: node scripts/create_admin_user.cjs

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vhphsaodwurjnwrnxflm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocGhzYW9kd3Vyam53cm54ZmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzQxNTUsImV4cCI6MjA3OTA1MDE1NX0.QxEwUtnwU7SBKbpdRMCnyeZwyayEO_h997f9_Y5YJho';

async function createAdminUser() {
  // Use service role key if available (can create users without email confirmation)
  // Otherwise use anon key (requires email confirmation)
  const key = supabaseServiceKey || supabaseAnonKey;
  const supabase = createClient(supabaseUrl, key);

  const email = 'max.eldon@gmail.com';
  const password = '123456';
  const fullName = 'Max Eldon';

  console.log('Creating admin user:', email);
  console.log('Using', supabaseServiceKey ? 'service role key' : 'anon key');

  try {
    if (supabaseServiceKey) {
      // Service role can create user directly
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'admin',
        },
      });

      if (error) {
        console.error('Error creating user:', error.message);
        process.exit(1);
      }

      console.log('✅ User created successfully with ID:', data.user.id);

      // Update admins table with auth_uid
      const { error: updateError } = await supabase
        .from('admins')
        .update({ auth_uid: data.user.id })
        .eq('email', email);

      if (updateError) {
        console.error('⚠️ Error updating admin auth_uid:', updateError.message);
      } else {
        console.log('✅ Admin record updated with auth_uid');
      }

    } else {
      // Anon key requires signup (email confirmation needed)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin',
          },
        },
      });

      if (error) {
        console.error('Error signing up user:', error.message);
        process.exit(1);
      }

      if (data.user) {
        console.log('✅ User signup initiated. User ID:', data.user.id);
        console.log('⚠️ Email confirmation required. Check inbox:', email);
        
        // Try to update auth_uid (may fail if RLS blocks it)
        const { error: updateError } = await supabase
          .from('admins')
          .update({ auth_uid: data.user.id })
          .eq('email', email);

        if (updateError) {
          console.log('⚠️ Could not auto-update auth_uid (will be set after first login)');
        } else {
          console.log('✅ Admin record updated with auth_uid');
        }
      } else {
        console.log('⚠️ User may already exist or confirmation pending');
      }
    }

    console.log('\n✅ Setup complete!');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createAdminUser();
