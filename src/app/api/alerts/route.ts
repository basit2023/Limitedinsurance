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
 * GET /api/alerts?centerId=xxx&days=7&status=all|acknowledged|unacknowledged
 * Returns alert history
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('centerId')
    const days = parseInt(searchParams.get('days') || '7')
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority')
    
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from('alerts_sent')
      .select(`
        *,
        alert_rules(*),
        centers(center_name, location, region)
      `)
      .gte('sent_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
    
    if (centerId) {
      query = query.eq('center_id', centerId)
    }
    
    const { data: alerts, error } = await query
    
    if (error) throw error
    
    // Filter by status
    let filteredAlerts = alerts || []
    
    if (status === 'acknowledged') {
      filteredAlerts = filteredAlerts.filter(a => a.acknowledged_at !== null)
    } else if (status === 'unacknowledged') {
      filteredAlerts = filteredAlerts.filter(a => a.acknowledged_at === null)
    }
    
    // Filter by priority
    if (priority && alerts) {
      filteredAlerts = filteredAlerts.filter(a => a.alert_rules?.priority === priority)
    }
    
    // Calculate statistics
    const stats = {
      total: filteredAlerts.length,
      acknowledged: filteredAlerts.filter(a => a.acknowledged_at !== null).length,
      unacknowledged: filteredAlerts.filter(a => a.acknowledged_at === null).length,
      byPriority: {
        critical: filteredAlerts.filter(a => a.alert_rules?.priority === 'critical').length,
        high: filteredAlerts.filter(a => a.alert_rules?.priority === 'high').length,
        medium: filteredAlerts.filter(a => a.alert_rules?.priority === 'medium').length,
        low: filteredAlerts.filter(a => a.alert_rules?.priority === 'low').length
      },
      byType: filteredAlerts.reduce((acc: Record<string, number>, alert) => {
        const type = alert.alert_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      alerts: filteredAlerts,
      stats,
      filters: {
        centerId,
        days,
        status,
        priority
      }
    })
  } catch (err) {
    console.error('Error fetching alerts:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching alerts'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/alerts
 * Manually trigger an alert (for testing or manual notifications)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { centerId, ruleId, message, channels = ['slack'] } = body
    
    if (!centerId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: centerId, message' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    // Validate center exists
    const { error: centerError } = await supabase
      .from('centers')
      .select('id')
      .eq('id', centerId)
      .single()
    
    if (centerError) throw centerError
    
    // Insert alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts_sent')
      .insert({
        rule_id: ruleId,
        center_id: centerId,
        alert_type: 'manual',
        message,
        channels_sent: channels,
        recipients: body.recipients || [],
        sent_at: new Date().toISOString(),
        metadata: body.metadata || {}
      })
      .select()
      .single()
    
    if (alertError) throw alertError
    
    return NextResponse.json({
      success: true,
      alert,
      message: 'Alert triggered successfully'
    })
  } catch (err) {
    console.error('Error creating alert:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error creating alert'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
