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
 * PATCH /api/alerts/[id]
 * Update an alert (primarily for acknowledgement)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params
    const body = await request.json()
    const { acknowledgedBy, responseAction } = body
    
    const supabase = getSupabaseClient()
    
    const updateData: Record<string, string> = {
      acknowledged_at: new Date().toISOString()
    }
    
    if (acknowledgedBy) {
      updateData.acknowledged_by = acknowledgedBy
    }
    
    if (responseAction) {
      updateData.response_action = responseAction
    }
    
    const { data: alert, error } = await supabase
      .from('alerts_sent')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      alert,
      message: 'Alert acknowledged successfully'
    })
  } catch (err) {
    console.error('Error acknowledging alert:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error acknowledging alert'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE /api/alerts/[id]
 * Delete an alert (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('alerts_sent')
      .delete()
      .eq('id', alertId)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    })
  } catch (err) {
    console.error('Error deleting alert:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error deleting alert'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
