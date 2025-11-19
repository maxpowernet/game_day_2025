require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vhphsaodwurjnwrnxflm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocGhzYW9kd3Vyam53cm54ZmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzQxNTUsImV4cCI6MjA3OTA1MDE1NX0.QxEwUtnwU7SBKbpdRMCnyeZwyayEO_h997f9_Y5YJho';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Testing insert into players using anon key...');
    const payload = {
      name: 'TEST PLAYER ' + Date.now(),
      role: 'tester',
      score: 0,
      game_coins: 0,
    };

    const { data, error } = await supabase.from('players').insert(payload).select().single();

    if (error) {
      console.error('Insert error:', error);
      process.exitCode = 2;
      return;
    }

    console.log('Insert success:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 3;
  }
}

run();
