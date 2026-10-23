import type { NextConfig } from 'next';

// Support both naming schemes:
// - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (canonical)
// - SUPABASE_URL / SUPABASE_ANON_KEY (as created by Vercel/Supabase integration or manually)
// next.config `env` inlines these values into the browser bundle at build time,
// so the client can read them under the NEXT_PUBLIC_ names either way.
const env: Record<string, string> = {};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
if (supabaseUrl) env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
if (supabaseAnon) env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnon;

const nextConfig: NextConfig = { reactStrictMode: true, transpilePackages: ['@excalidraw/excalidraw'], env };
export default nextConfig;
