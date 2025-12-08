import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error. Please contact administrator.' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    const body = await request.json()
    const { email, password, full_name } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).limit(1).single()
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    // Ensure admin user_type exists
    let { data: types } = await supabase.from('user_types').select('id').eq('name', 'admin').limit(1)
    let adminTypeId = types && types.length ? types[0].id : null
    if (!adminTypeId) {
      const { data: insertType } = await supabase.from('user_types').insert([{ 
        name: 'admin', 
        permission_level: 100, 
        can_create: true, 
        can_edit: true, 
        can_delete: true, 
        can_view: true, 
        description: 'Default admin' 
      }]).select().limit(1).single()
      adminTypeId = insertType?.id
    }

    // Insert user with hashed password
    const { data: userRow, error: insertError } = await supabase.from('users').insert([{ 
      email, 
      full_name, 
      password_hash,
      user_type_id: adminTypeId 
    }]).select('id, email, full_name, user_type_id, status, created_at').single()
    
    if (insertError) throw insertError

    // Get user_type name
    const { data: userType } = await supabase.from('user_types').select('name').eq('id', adminTypeId).limit(1).single()

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: userRow.id, 
        email: userRow.email,
        userType: userType?.name || 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({ 
      user: userRow, 
      token,
      user_type: userType?.name || 'admin'
    })
  } catch (err: any) {
    console.error('register error', err)
    return NextResponse.json({ error: err.message || 'Error registering user' }, { status: 500 })
  }
}
