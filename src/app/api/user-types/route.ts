import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })
}

export async function GET() {
  const supabase = getSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('user_types')
      .select('id, name, permission_level, can_create, can_edit, can_delete, can_view, description, status')
      .eq('status', true)
      .order('permission_level', { ascending: true })
    
    if (error) throw error
    return NextResponse.json({ userTypes: data })
  } catch (err) {
    console.error(err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching user types'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
