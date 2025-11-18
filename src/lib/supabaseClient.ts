import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vhphsaodwurjnwrnxflm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocGhzYW9kd3Vyam53cm54ZmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzQxNTUsImV4cCI6MjA3OTA1MDE1NX0.QxEwUtnwU7SBKbpdRMCnyeZwyayEO_h997f9_Y5YJho';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
