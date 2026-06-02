import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase environment variables are missing! Database features will be disabled.');
}

const createDisabledQuery = () => {
  const result = {
    data: null,
    error: new Error('Supabase is not configured.'),
    count: null,
  };

  const query = new Proxy(() => query, {
    get(_target, prop) {
      if (prop === 'then') return Promise.resolve(result).then.bind(Promise.resolve(result));
      if (prop === 'catch') return Promise.resolve(result).catch.bind(Promise.resolve(result));
      if (prop === 'finally') return Promise.resolve(result).finally.bind(Promise.resolve(result));
      return query;
    },
    apply() {
      return query;
    },
  });

  return query;
};

const disabledSupabase = {
  from: () => createDisabledQuery(),
  rpc: () => createDisabledQuery(),
  storage: {
    from: () => createDisabledQuery(),
  },
};

// Use the service role key to bypass RLS for backend operations
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : disabledSupabase as ReturnType<typeof createClient>;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);
