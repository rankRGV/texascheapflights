import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase environment variables are missing! Database features will be disabled.');
}

// Use the service role key to bypass RLS for backend operations
export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);
