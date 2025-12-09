import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTotalSalesVolume,
  getDQPercentage,
  getApprovalRate,
  getApprovalRatioTransferVsSubmission
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
 * GET /api/dashboard/rankings?date=YYYY-MM-DD&metric=sales|dq|approval
 * Returns BPO rankings based on performance metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const metric = searchParams.get('metric') || 'sales'
    
    const supabase = getSupabaseClient()
    
    // Get all active centers
    const { data: centers, error: centersError } = await supabase
      .from('centers')
      .select('id, center_name, region, location, daily_sales_target')
      .eq('status', true)
    
    if (centersError) throw centersError
    
    // Get metrics for each center
    const centerMetrics = await Promise.all(
      (centers || []).map(async (center) => {
        const [sales, dqData, approvalRate, approvalRatio] = await Promise.all([
          getTotalSalesVolume(date, center.id),
          getDQPercentage(date, center.id),
          getApprovalRate(date, center.id),
          getApprovalRatioTransferVsSubmission(date, center.id)
        ])
        
        const targetAchievement = (sales / center.daily_sales_target) * 100
        
        return {
          centerId: center.id,
          centerName: center.center_name,
          region: center.region,
          location: center.location,
          sales,
          target: center.daily_sales_target,
          targetAchievement: Math.round(targetAchievement * 10) / 10,
          dqPercentage: dqData.percentage,
          dqCount: dqData.count,
          approvalRate: approvalRate.rate,
          approvalRatio: approvalRatio.ratio,
          score: 0 // Will be calculated based on metric
        }
      })
    )
    
    // Calculate scores and rank based on selected metric
    let rankedCenters = centerMetrics.map(center => {
      let score = 0
      
      switch (metric) {
        case 'sales':
          score = center.targetAchievement
          break
        case 'dq':
          // Lower DQ is better, so invert the score
          score = Math.max(0, 100 - center.dqPercentage)
          break
        case 'approval':
          score = center.approvalRate
          break
        case 'overall':
          // Composite score: 40% sales, 30% approval, 30% quality (inverse DQ)
          score = (
            center.targetAchievement * 0.4 +
            center.approvalRate * 0.3 +
            Math.max(0, 100 - center.dqPercentage) * 0.3
          )
          break
        default:
          score = center.targetAchievement
      }
      
      return { ...center, score: Math.round(score * 10) / 10 }
    })
    
    // Sort by score (descending)
    rankedCenters.sort((a, b) => b.score - a.score)
    
    // Add rank
    rankedCenters = rankedCenters.map((center, index) => ({
      ...center,
      rank: index + 1,
      badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null
    }))
    
    // Identify top 3 and bottom 3
    const top3 = rankedCenters.slice(0, 3)
    const bottom3 = rankedCenters.slice(-3).reverse()
    
    return NextResponse.json({
      date,
      metric,
      rankings: rankedCenters,
      highlights: {
        top3,
        bottom3,
        averageTargetAchievement: Math.round(
          rankedCenters.reduce((sum, c) => sum + c.targetAchievement, 0) / rankedCenters.length * 10
        ) / 10,
        averageDQ: Math.round(
          rankedCenters.reduce((sum, c) => sum + c.dqPercentage, 0) / rankedCenters.length * 10
        ) / 10,
        averageApproval: Math.round(
          rankedCenters.reduce((sum, c) => sum + c.approvalRate, 0) / rankedCenters.length * 10
        ) / 10
      }
    })
  } catch (err) {
    console.error('Rankings error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching rankings'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
