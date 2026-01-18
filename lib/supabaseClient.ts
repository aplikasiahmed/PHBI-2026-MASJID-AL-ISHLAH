import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE (PRODUCTION) ---
const supabaseUrl = 'https://bmcenhkcwuxnclmlcriy.supabase.co'; 
const supabaseKey = 'sb_publishable_zmGkYX6vkmyTTXcHows6-g_j4qmKPK9';

// Inisialisasi Client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);