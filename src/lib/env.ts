const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL en el entorno (.env)');
}

if (!supabaseAnonKey) {
  throw new Error('Falta EXPO_PUBLIC_SUPABASE_ANON_KEY en el entorno (.env)');
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;
