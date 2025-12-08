import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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
      .from('users')
      .select(`
        id,
        email,
        full_name,
        status,
        created_at,
        user_type_id,
        user_types(
          name,
          permission_level,
          can_create,
          can_edit,
          can_delete,
          can_view
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
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
    const { email, full_name, user_type_id, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email, 
        full_name, 
        user_type_id,
        password_hash,
        status: true 
      }])
      .select(`
        id,
        email,
        full_name,
        status,
        created_at,
        user_type_id,
        user_types(
          name,
          permission_level,
          can_create,
          can_edit,
          can_delete,
          can_view
        )
      `)
      .single()
    
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
    const { id, email, full_name, user_type_id, status, password } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const updates: Record<string, unknown> = { 
      email, 
      full_name, 
      status, 
      user_type_id, 
      updated_at: new Date().toISOString() 
    }

    // Hash new password if provided
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10)
    }

    // Remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        status,
        created_at,
        user_type_id,
        user_types(
          name,
          permission_level,
          can_create,
          can_edit,
          can_delete,
          can_view
        )
      `)
      .single()
    
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
