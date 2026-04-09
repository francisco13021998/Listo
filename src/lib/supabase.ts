import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig, missingSupabaseConfigMessage } from './env';

const missingSupabaseClient = new Proxy(
	{},
	{
		get() {
			throw new Error(missingSupabaseConfigMessage);
		},
	}
) as SupabaseClient;

export const supabase = hasSupabaseConfig ? createClient(env.supabaseUrl, env.supabaseAnonKey) : missingSupabaseClient;
