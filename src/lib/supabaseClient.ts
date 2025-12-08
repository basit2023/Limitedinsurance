import { createClient } from '@supabase/supabase-js'

// Client-side helper (browser). Uses anon key.
// Ensure these env vars are set in your Next.js environment:
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail early in development if missing
  // Server-side routes should use the service role key instead.
  console.warn('Missing NEXT_PUBLIC_SUPABASE_* env vars for supabase client')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
