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
    const { data, error } = await supabase.from('users').select('id,email,full_name,permissions,is_active,created_at').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return NextResponse.json({ users: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Error fetching users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { email, full_name, user_type_name, permissions } = body

    // find user_type id
    let user_type_id = null
    if (user_type_name) {
      const { data: types } = await supabase.from('user_types').select('id').eq('name', user_type_name).limit(1)
      if (types && types.length) user_type_id = types[0].id
    }

    const { data, error } = await supabase.from('users').insert([{ email, full_name, user_type_id, permissions }]).select().single()
    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Error creating user' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { id, email, full_name, user_type_name, permissions, is_active } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    let user_type_id = null
    if (user_type_name) {
      const { data: types } = await supabase.from('user_types').select('id').eq('name', user_type_name).limit(1)
      if (types && types.length) user_type_id = types[0].id
    }

    const updates: any = { email, full_name, permissions, is_active, user_type_id, updated_at: new Date().toISOString() }
    // remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ user: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Error updating user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Error deleting user' }, { status: 500 })
  }
}
