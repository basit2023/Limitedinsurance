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
 * GET /api/admin/alert-rules
 * Returns all alert rules
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .order('priority', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ rules: rules || [] })
  } catch (err) {
    console.error('Error fetching alert rules:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching alert rules'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/admin/alert-rules
 * Create a new alert rule
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      ruleName,
      triggerType,
      conditionThreshold,
      alertMessageTemplate,
      recipientRoles,
      channels,
      priority,
      quietHoursStart,
      quietHoursEnd,
      createdBy
    } = body
    
    if (!ruleName || !triggerType || !alertMessageTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: ruleName, triggerType, alertMessageTemplate' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .insert({
        rule_name: ruleName,
        trigger_type: triggerType,
        condition_threshold: conditionThreshold || 0,
        alert_message_template: alertMessageTemplate,
        recipient_roles: recipientRoles || [],
        channels: channels || ['slack'],
        priority: priority || 'medium',
        enabled: true,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      rule,
      message: 'Alert rule created successfully'
    })
  } catch (err) {
    console.error('Error creating alert rule:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error creating alert rule'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/alert-rules?id=xxx
 * Update an alert rule
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')
    
    if (!ruleId) {
      return NextResponse.json({ error: 'Missing rule ID' }, { status: 400 })
    }
    
    const body = await request.json()
    const supabase = getSupabaseClient()
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }
    
    // Remove id from update data if present
    delete updateData.id
    delete updateData.created_at
    delete updateData.created_by
    
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      rule,
      message: 'Alert rule updated successfully'
    })
  } catch (err) {
    console.error('Error updating alert rule:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error updating alert rule'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
