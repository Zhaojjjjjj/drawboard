import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

// Lazy singleton: do NOT call at module/render top level of a page.
// Static prerendering runs component bodies on the server at build time,
// where creating a client with missing env throws and fails the whole build.
// Call this inside useEffect / event handlers (browser-only) instead.
export function createClient(): SupabaseClient {
  if (!cached) {
    cached = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return cached;
}
