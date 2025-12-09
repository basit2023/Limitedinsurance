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
 * GET /api/quality/corrective-actions?status=all|assigned|in_progress|completed
 * Returns corrective actions
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const centerId = searchParams.get('centerId')
    
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from('corrective_actions')
      .select(`
        *,
        centers(center_name, region),
        dq_items(dq_category, severity)
      `)
      .order('created_at', { ascending: false })
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (centerId) {
      query = query.eq('center_id', centerId)
    }
    
    const { data: actions, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      actions: actions || [],
      stats: {
        total: actions?.length || 0,
        assigned: actions?.filter(a => a.status === 'assigned').length || 0,
        inProgress: actions?.filter(a => a.status === 'in_progress').length || 0,
        completed: actions?.filter(a => a.status === 'completed').length || 0,
        verified: actions?.filter(a => a.status === 'verified').length || 0
      }
    })
  } catch (err) {
    console.error('Error fetching corrective actions:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching corrective actions'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/quality/corrective-actions
 * Create a new corrective action
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dqItemId, centerId, assignedTo, issueDescription, targetDate, notes, createdBy } = body
    
    if (!centerId || !issueDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: centerId, issueDescription' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    const { data: action, error } = await supabase
      .from('corrective_actions')
      .insert({
        dq_item_id: dqItemId,
        center_id: centerId,
        assigned_to: assignedTo,
        issue_description: issueDescription,
        status: 'assigned',
        target_date: targetDate,
        notes,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      action,
      message: 'Corrective action created successfully'
    })
  } catch (err) {
    console.error('Error creating corrective action:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error creating corrective action'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH /api/quality/corrective-actions?id=xxx
 * Update a corrective action
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const actionId = searchParams.get('id')
    
    if (!actionId) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 })
    }
    
    const body = await request.json()
    const { status, notes, targetDate } = body
    
    const supabase = getSupabaseClient()
    
    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString()
    }
    
    if (status) updateData.status = status
    if (notes) updateData.notes = notes
    if (targetDate) updateData.target_date = targetDate
    
    const { data: action, error } = await supabase
      .from('corrective_actions')
      .update(updateData)
      .eq('id', actionId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      action,
      message: 'Corrective action updated successfully'
    })
  } catch (err) {
    console.error('Error updating corrective action:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error updating corrective action'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
