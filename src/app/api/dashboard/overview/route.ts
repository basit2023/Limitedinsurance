import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getComprehensiveMetrics,
  getHourlyData,
  getTrendMetrics,
  getTotalSalesVolume,
  getDQPercentage,
  getApprovalRate
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
 * GET /api/dashboard/overview?date=YYYY-MM-DD
 * Returns overview metrics and center performance
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const supabase = getSupabaseClient()
    
    // Get all active centers
    const { data: centers, error: centersError } = await supabase
      .from('centers')
      .select('id, center_name, daily_sales_target, region, location')
      .eq('status', true)
    
    if (centersError) throw centersError
    
    // Get metrics for each center
    const centerPerformances = await Promise.all(
      (centers || []).map(async (center) => {
        const [metrics, dqData, approvalData, trend] = await Promise.all([
          getTotalSalesVolume(date, center.id),
          getDQPercentage(date, center.id),
          getApprovalRate(date, center.id),
          getTrendMetrics(center.id, date)
        ])
        
        // Determine status color
        const targetPercentage = (metrics / center.daily_sales_target) * 100
        let status: 'green' | 'yellow' | 'red' = 'green'
        
        if (targetPercentage < 50) {
          status = 'red'
        } else if (targetPercentage < 80) {
          status = 'yellow'
        }
        
        // Determine trend
        const trendPercentage = trend.vsYesterday.sales
        let trendDirection: 'up' | 'down' | 'neutral' = 'neutral'
        
        if (trendPercentage > 5) {
          trendDirection = 'up'
        } else if (trendPercentage < -5) {
          trendDirection = 'down'
        }
        
        return {
          centerId: center.id,
          centerName: center.center_name,
          region: center.region,
          location: center.location,
          salesCount: metrics,
          target: center.daily_sales_target,
          targetPercentage: Math.round(targetPercentage),
          dqPercentage: dqData.percentage,
          dqCount: dqData.count,
          approvalRate: approvalData.rate,
          approvalCount: approvalData.count,
          status,
          trend: trendDirection,
          trendPercentage: Math.round(trendPercentage * 10) / 10
        }
      })
    )
    
    // Get overall metrics
    const overallMetrics = await getComprehensiveMetrics(date)
    
    // Get hourly data
    const hourlyData = await getHourlyData(date)
    
    return NextResponse.json({
      date,
      overallMetrics,
      centerPerformances,
      hourlyData,
      summary: {
        totalCenters: centers?.length || 0,
        centersOnTarget: centerPerformances.filter(c => c.status === 'green').length,
        centersAtRisk: centerPerformances.filter(c => c.status === 'red').length,
        avgDQ: centerPerformances.length > 0 
          ? Math.round(centerPerformances.reduce((sum, c) => sum + c.dqPercentage, 0) / centerPerformances.length * 10) / 10
          : 0
      }
    })
  } catch (err) {
    console.error('Dashboard overview error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching dashboard overview'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
