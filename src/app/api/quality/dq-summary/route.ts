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
 * GET /api/quality/dq-summary?days=7|14|30
 * Returns DQ summary and trends
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const supabase = getSupabaseClient()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    // Get all DQ items in the range
    const { data: dqItems, error } = await supabase
      .from('dq_items')
      .select(`
        *,
        centers(center_name, region),
        daily_deal_flow(agent, insured_name, date)
      `)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Group by category
    const byCategory = (dqItems || []).reduce((acc: Record<string, number>, item) => {
      const category = item.dq_category || 'Unknown'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Group by center
    interface CenterData {
      count: number
      items: any[]
    }
    
    const byCenter = (dqItems || []).reduce((acc: Record<string, CenterData>, item) => {
      const centerName = item.centers?.center_name || 'Unknown'
      if (!acc[centerName]) {
        acc[centerName] = { count: 0, items: [] }
      }
      acc[centerName].count++
      acc[centerName].items.push(item)
      return acc
    }, {} as Record<string, CenterData>)
    
    // Group by severity
    const bySeverity = (dqItems || []).reduce((acc: Record<string, number>, item) => {
      const severity = item.severity || 'low'
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate daily trend
    const dailyTrend: Record<string, number> = {}
    for (const item of dqItems || []) {
      const date = item.created_at?.split('T')[0] || 'Unknown'
      dailyTrend[date] = (dailyTrend[date] || 0) + 1
    }
    
    // Top issues
    const topIssues = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }))
    
    // Top centers with DQ
    const topCenters = Object.entries(byCenter)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([center, data]) => ({ center, count: data.count }))
    
    return NextResponse.json({
      summary: {
        totalDQItems: dqItems?.length || 0,
        days,
        avgPerDay: dqItems ? Math.round((dqItems.length / days) * 10) / 10 : 0
      },
      byCategory,
      byCenter,
      bySeverity,
      topIssues,
      topCenters,
      dailyTrend,
      recentItems: dqItems?.slice(0, 20) || []
    })
  } catch (err) {
    console.error('Error fetching DQ summary:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching DQ summary'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
