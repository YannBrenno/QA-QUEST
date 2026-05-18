// src/services/supabase.js
// Singleton Supabase client

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[Supabase] Variáveis de ambiente não encontradas. Crie o arquivo .env a partir de .env.example');
}

let _supabase = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
} catch (e) {
  console.error('[Supabase] createClient falhou:', e);
}

// Fallback stub so the app doesn't crash if Supabase is unavailable
export const supabase = _supabase || {
  from: () => ({ upsert: async () => ({}), update: async () => ({}), select: async () => ({ data: [] }), delete: async () => ({}) }),
  removeChannel: () => {},
  channel: () => ({ on: function() { return this; }, subscribe: () => {} }),
};
