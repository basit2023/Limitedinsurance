import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTotalSalesVolume,
  getTotalUnderwritingVolume,
  getTransferCount,
  getApprovalRate,
  getDQPercentage,
  getCallbackRate,
  getApprovalRatioTransferVsSubmission,
  getCenterDailyPerformance
} from '@/services/metricsService'

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
 * GET /api/dashboard/center/[id]?date=YYYY-MM-DD&range=7|14|30
 * Returns detailed metrics for a specific center
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: centerId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const range = parseInt(searchParams.get('range') || '7')
    
    const supabase = getSupabaseClient()
    
    // Get center details
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('*')
      .eq('id', centerId)
      .single()
    
    if (centerError) throw centerError
    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }
    
    // Get current day metrics
    const [
      salesVolume,
      uwVolume,
      transfers,
      approvalRate,
      dqData,
      callbackRate,
      approvalRatio
    ] = await Promise.all([
      getTotalSalesVolume(date, centerId),
      getTotalUnderwritingVolume(date, centerId),
      getTransferCount(date, centerId),
      getApprovalRate(date, centerId),
      getDQPercentage(date, centerId),
      getCallbackRate(date, centerId),
      getApprovalRatioTransferVsSubmission(date, centerId)
    ])
    
    // Get historical performance
    const historicalData = await getCenterDailyPerformance(centerId, range)
    
    // Get recent alerts for this center
    const { data: recentAlerts } = await supabase
      .from('alerts_sent')
      .select('*')
      .eq('center_id', centerId)
      .gte('sent_at', new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(10)
    
    // Get active DQ items
    const { data: dqItems } = await supabase
      .from('dq_items')
      .select('*, daily_deal_flow!inner(agent, insured_name)')
      .eq('center_id', centerId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
    
    // Get corrective actions
    const { data: correctiveActions } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('center_id', centerId)
      .in('status', ['assigned', 'in_progress'])
      .order('target_date', { ascending: true })
    
    // Calculate status
    const targetPercentage = (salesVolume / center.daily_sales_target) * 100
    let status: 'green' | 'yellow' | 'red' = 'green'
    
    if (targetPercentage < 50) {
      status = 'red'
    } else if (targetPercentage < 80) {
      status = 'yellow'
    }
    
    return NextResponse.json({
      center: {
        id: center.id,
        name: center.center_name,
        location: center.location,
        region: center.region,
        target: center.daily_sales_target,
        status: center.status,
        manager: center.manager_id
      },
      currentMetrics: {
        date,
        salesVolume,
        uwVolume,
        transfers,
        approvalRate: approvalRate.rate,
        approvalCount: approvalRate.count,
        dqPercentage: dqData.percentage,
        dqCount: dqData.count,
        callbackRate: callbackRate.rate,
        callbackCount: callbackRate.count,
        approvalRatio: approvalRatio.ratio,
        targetPercentage: Math.round(targetPercentage),
        status
      },
      historicalData,
      recentAlerts: recentAlerts || [],
      dqItems: dqItems || [],
      correctiveActions: correctiveActions || []
    })
  } catch (err) {
    console.error('Center detail error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching center details'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
