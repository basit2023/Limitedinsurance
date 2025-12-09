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

export interface MetricsData {
  totalSales: number
  totalUnderwriting: number
  totalTransfers: number
  approvalRate: number
  approvalCount: number
  callbackRate: number
  callbackCount: number
  dqPercentage: number
  dqCount: number
}

export interface CenterPerformance {
  centerId: string
  centerName: string
  salesCount: number
  target: number
  dqPercentage: number
  approvalRate: number
  status: 'green' | 'yellow' | 'red'
  trend: 'up' | 'down' | 'neutral'
  trendPercentage: number
}

export interface HourlyData {
  hour: number
  sales: number
  transfers: number
}

export interface TrendMetrics {
  vsYesterday: {
    sales: number
    transfers: number
    approvalRate: number
  }
  vsLastWeek: {
    sales: number
    transfers: number
    approvalRate: number
  }
}

/**
 * Get total sales volume for a date and center
 * Sales = status 'Pending Approval' AND call_result 'Submitted'
 */
export async function getTotalSalesVolume(date: string, centerId?: string): Promise<number> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('daily_deal_flow')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .eq('status', 'Pending Approval')
    .eq('call_result', 'Submitted')
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  return count || 0
}

/**
 * Get total underwriting volume for a date and center
 * Underwriting = status 'Pending Approval' AND call_result 'Underwriting'
 */
export async function getTotalUnderwritingVolume(date: string, centerId?: string): Promise<number> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('daily_deal_flow')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .eq('status', 'Pending Approval')
    .eq('call_result', 'Underwriting')
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  return count || 0
}

/**
 * Get total transfer count for a date and center
 * Transfers = total entries for the day
 */
export async function getTransferCount(date: string, centerId?: string): Promise<number> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('daily_deal_flow')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  return count || 0
}

/**
 * Get approval rate percentage
 * Approval Rate = (Pending Approval count / Total entries) * 100
 */
export async function getApprovalRate(date: string, centerId?: string): Promise<{ rate: number; count: number }> {
  const supabase = getSupabaseClient()
  
  const totalEntries = await getTransferCount(date, centerId)
  
  if (totalEntries === 0) {
    return { rate: 0, count: 0 }
  }
  
  let query = supabase
    .from('daily_deal_flow')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .eq('status', 'Pending Approval')
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  
  const pendingCount = count || 0
  const rate = (pendingCount / totalEntries) * 100
  
  return { rate: Math.round(rate * 100) / 100, count: pendingCount }
}

/**
 * Get DQ percentage for a date and center
 */
export async function getDQPercentage(date: string, centerId?: string): Promise<{ percentage: number; count: number }> {
  const supabase = getSupabaseClient()
  
  // Get total entries for the day
  const totalEntries = await getTransferCount(date, centerId)
  
  if (totalEntries === 0) {
    return { percentage: 0, count: 0 }
  }
  
  // Get DQ items for the date
  let query = supabase
    .from('dq_items')
    .select('id', { count: 'exact', head: true })
    .gte('discovered_date', date)
    .lte('discovered_date', date)
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  
  const dqCount = count || 0
  const percentage = (dqCount / totalEntries) * 100
  
  return { percentage: Math.round(percentage * 100) / 100, count: dqCount }
}

/**
 * Get callback rate for a date and center
 */
export async function getCallbackRate(date: string, centerId?: string): Promise<{ rate: number; count: number }> {
  const supabase = getSupabaseClient()
  
  const totalEntries = await getTransferCount(date, centerId)
  
  if (totalEntries === 0) {
    return { rate: 0, count: 0 }
  }
  
  let query = supabase
    .from('daily_deal_flow')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .or('from_callback.eq.true,is_callback.eq.true')
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { count, error } = await query
  
  if (error) throw error
  
  const callbackCount = count || 0
  const rate = (callbackCount / totalEntries) * 100
  
  return { rate: Math.round(rate * 100) / 100, count: callbackCount }
}

/**
 * Get approval ratio: submissions vs transfers
 */
export async function getApprovalRatioTransferVsSubmission(
  date: string,
  centerId?: string
): Promise<{ ratio: number; submissions: number; transfers: number }> {
  const transfers = await getTransferCount(date, centerId)
  const submissions = await getTotalSalesVolume(date, centerId)
  
  if (transfers === 0) {
    return { ratio: 0, submissions, transfers }
  }
  
  const ratio = (submissions / transfers) * 100
  
  return { ratio: Math.round(ratio * 100) / 100, submissions, transfers }
}

/**
 * Get trend metrics comparing to yesterday and last week
 */
export async function getTrendMetrics(centerId?: string, date?: string): Promise<TrendMetrics> {
  const today = date || new Date().toISOString().split('T')[0]
  const yesterday = new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastWeek = new Date(new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const [
    todaySales,
    todayTransfers,
    todayApproval,
    yesterdaySales,
    yesterdayTransfers,
    yesterdayApproval,
    lastWeekSales,
    lastWeekTransfers,
    lastWeekApproval
  ] = await Promise.all([
    getTotalSalesVolume(today, centerId),
    getTransferCount(today, centerId),
    getApprovalRate(today, centerId),
    getTotalSalesVolume(yesterday, centerId),
    getTransferCount(yesterday, centerId),
    getApprovalRate(yesterday, centerId),
    getTotalSalesVolume(lastWeek, centerId),
    getTransferCount(lastWeek, centerId),
    getApprovalRate(lastWeek, centerId)
  ])
  
  return {
    vsYesterday: {
      sales: yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0,
      transfers: yesterdayTransfers ? ((todayTransfers - yesterdayTransfers) / yesterdayTransfers) * 100 : 0,
      approvalRate: todayApproval.rate - yesterdayApproval.rate
    },
    vsLastWeek: {
      sales: lastWeekSales ? ((todaySales - lastWeekSales) / lastWeekSales) * 100 : 0,
      transfers: lastWeekTransfers ? ((todayTransfers - lastWeekTransfers) / lastWeekTransfers) * 100 : 0,
      approvalRate: todayApproval.rate - lastWeekApproval.rate
    }
  }
}

/**
 * Get center daily performance for a range of days
 */
export async function getCenterDailyPerformance(
  centerId: string,
  range: 7 | 14 | 30 = 7
): Promise<Array<{
  date: string
  transfers: number
  sales: number
  approvals: number
  underwriting: number
  dq: number
  callbacks: number
}>> {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(new Date(endDate).getTime() - range * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('daily_deal_flow')
    .select('*')
    .eq('center_id', centerId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) throw error
  
  // Group by date
  const grouped = (data || []).reduce((acc, item) => {
    const date = item.date
    if (!acc[date]) {
      acc[date] = {
        date,
        transfers: 0,
        sales: 0,
        approvals: 0,
        underwriting: 0,
        callbacks: 0
      }
    }
    
    acc[date].transfers++
    
    if (item.status === 'Pending Approval' && item.call_result === 'Submitted') {
      acc[date].sales++
    }
    
    if (item.status === 'Pending Approval') {
      acc[date].approvals++
    }
    
    if (item.status === 'Pending Approval' && item.call_result === 'Underwriting') {
      acc[date].underwriting++
    }
    
    if (item.from_callback || item.is_callback) {
      acc[date].callbacks++
    }
    
    return acc
  }, {} as Record<string, any>)
  
  // Get DQ counts
  const { data: dqData } = await supabase
    .from('dq_items')
    .select('discovered_date')
    .eq('center_id', centerId)
    .gte('discovered_date', startDate)
    .lte('discovered_date', endDate)
  
  const dqByDate = (dqData || []).reduce((acc, item) => {
    acc[item.discovered_date] = (acc[item.discovered_date] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Combine and return
  return Object.values(grouped).map(day => ({
    ...day,
    dq: dqByDate[day.date] || 0
  }))
}

/**
 * Get hourly data for a specific date
 */
export async function getHourlyData(date: string, centerId?: string): Promise<HourlyData[]> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('daily_deal_flow')
    .select('created_at, status, call_result')
    .eq('date', date)
  
  if (centerId) {
    query = query.eq('center_id', centerId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Group by hour
  const hourlyMap = new Map<number, { sales: number; transfers: number }>()
  
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { sales: 0, transfers: 0 })
  }
  
  (data || []).forEach(item => {
    const hour = new Date(item.created_at).getHours()
    const hourData = hourlyMap.get(hour) || { sales: 0, transfers: 0 }
    
    hourData.transfers++
    
    if (item.status === 'Pending Approval' && item.call_result === 'Submitted') {
      hourData.sales++
    }
    
    hourlyMap.set(hour, hourData)
  })
  
  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    ...data
  }))
}

/**
 * Get comprehensive metrics for dashboard
 */
export async function getComprehensiveMetrics(date: string, centerId?: string): Promise<MetricsData> {
  const [
    totalSales,
    totalUnderwriting,
    totalTransfers,
    approvalData,
    dqData,
    callbackData
  ] = await Promise.all([
    getTotalSalesVolume(date, centerId),
    getTotalUnderwritingVolume(date, centerId),
    getTransferCount(date, centerId),
    getApprovalRate(date, centerId),
    getDQPercentage(date, centerId),
    getCallbackRate(date, centerId)
  ])
  
  return {
    totalSales,
    totalUnderwriting,
    totalTransfers,
    approvalRate: approvalData.rate,
    approvalCount: approvalData.count,
    callbackRate: callbackData.rate,
    callbackCount: callbackData.count,
    dqPercentage: dqData.percentage,
    dqCount: dqData.count
  }
}
