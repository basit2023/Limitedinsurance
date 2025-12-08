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
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })

    // Get user with password hash
    const { data: userRow, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, password_hash, user_type_id, status')
      .eq('email', email)
      .limit(1)
      .single()

    if (fetchError || !userRow) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!userRow.status) {
      return NextResponse.json({ error: 'Account is inactive. Please contact administrator.' }, { status: 403 })
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Get user_type with permissions
    const { data: userType } = await supabase
      .from('user_types')
      .select('name, permission_level, can_create, can_edit, can_delete, can_view')
      .eq('id', userRow.user_type_id)
      .limit(1)
      .single()

    // Create JWT token with permissions
    const token = jwt.sign(
      { 
        userId: userRow.id, 
        email: userRow.email,
        userType: userType?.name || 'user',
        permissions: {
          permission_level: userType?.permission_level || 0,
          can_create: userType?.can_create || false,
          can_edit: userType?.can_edit || false,
          can_delete: userType?.can_delete || false,
          can_view: userType?.can_view || true
        }
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove password_hash from response
    const { password_hash, ...safeUser } = userRow

    return NextResponse.json({ 
      user: safeUser, 
      token,
      user_type: userType?.name || 'user',
      permissions: {
        permission_level: userType?.permission_level || 0,
        can_create: userType?.can_create || false,
        can_edit: userType?.can_edit || false,
        can_delete: userType?.can_delete || false,
        can_view: userType?.can_view || true
      }
    })
  } catch (err: any) {
    console.error('login error', err)
    return NextResponse.json({ error: err.message || 'Error logging in' }, { status: 500 })
  }
}
