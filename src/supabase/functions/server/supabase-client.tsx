/**
 * Singleton Supabase Client
 * 
 * CRITICAL: This file ensures only ONE Supabase client instance exists
 * to prevent database connection exhaustion.
 * 
 * ALL server files must import from here instead of creating their own clients.
 */

import { createClient } from "jsr:@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    console.log('🔧 [Singleton] Creating Supabase client instance...');
    supabaseInstance = createClient(url, key);
    console.log('✅ [Singleton] Supabase client created');
  }
  
  return supabaseInstance;
}

// Export singleton instance for direct use
export const supabase = getSupabaseClient();
