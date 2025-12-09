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

/**
 * GET /api/admin/centers
 * Returns all centers
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: centers, error } = await supabase
      .from('centers')
      .select('*')
      .order('center_name', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ centers: centers || [] })
  } catch (err) {
    console.error('Error fetching centers:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching centers'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/admin/centers
 * Create a new center
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { centerName, location, region, dailySalesTarget, managerId } = body
    
    if (!centerName || !dailySalesTarget) {
      return NextResponse.json(
        { error: 'Missing required fields: centerName, dailySalesTarget' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    const { data: center, error } = await supabase
      .from('centers')
      .insert({
        center_name: centerName,
        location,
        region,
        daily_sales_target: dailySalesTarget,
        manager_id: managerId,
        status: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      center,
      message: 'Center created successfully'
    })
  } catch (err) {
    console.error('Error creating center:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error creating center'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
