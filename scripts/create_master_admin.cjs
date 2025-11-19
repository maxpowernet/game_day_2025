require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE in your environment (or .env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole);

const email = 'max.eldon@gmail.com';
const password = '123456';
const fullName = 'Max Eldon';

async function run() {
  try {
    console.log('Creating master admin user (service role) ->', email);

    // 1) Create auth user via admin API
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'master_admin' },
    });

    if (createErr) {
      console.error('Error creating auth user:', createErr.message || createErr);
      // continue: attempt to find existing user
    }

    const userId = (userData && userData.user && userData.user.id) || null;
    if (userId) console.log('Auth user id:', userId);

    // 2) Ensure admins row exists
    const upsert = {
      name: fullName,
      email,
      invited: true,
      invite_token: 'initial-master-invite',
      auth_uid: userId,
    };

    const { data: adminRow, error: upsertErr } = await supabase
      .from('admins')
      .upsert(upsert, { onConflict: 'email' })
      .select()
      .single();

    if (upsertErr) {
      console.error('Error upserting admins row:', upsertErr.message || upsertErr);
      process.exit(1);
    }

    console.log('✅ Admin row upserted:', adminRow.email);

    console.log('\nSetup complete. Admin credentials:');
    console.log('  email:', email);
    console.log('  password:', password);
    console.log('\nImportant: keep the service_role key secret. Remove it from the env after running.');

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
