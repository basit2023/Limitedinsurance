import { createClient } from '@supabase/supabase-js'
import {
  getComprehensiveMetrics,
  getCenterDailyPerformance,
  getTotalSalesVolume,
  getDQPercentage,
  getApprovalRate
} from './metricsService'
import { sendEmail } from './notificationDispatcher'

// Define interfaces for reports
interface MorningBriefReport {
  date: string
  yesterdayDate: string
  summary: {
    totalCenters: number
    centersOnTarget: number
    avgAchievement: number
    totalSales: number
  }
  top3: Array<{
    center: string
    sales: number
    target: number
    achievement: number
    dqPercentage: number
    approvalRate: number
  }>
  bottom3: Array<{
    center: string
    sales: number
    target: number
    achievement: number
    dqPercentage: number
    approvalRate: number
  }>
  criticalIssues: Record<string, unknown>[]
  todayTarget: number
}

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
 * Build Daily Morning Brief (08:00 AM)
 */
export async function buildDailyMorningBrief(date: string = new Date().toISOString().split('T')[0]): Promise<MorningBriefReport> {
  const supabase = getSupabaseClient()

  // Get yesterday's date
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Get all active centers
  const { data: centers } = await supabase
    .from('centers')
    .select('*')
    .eq('status', true)

  // Get yesterday's performance
  const yesterdayPerformance = await Promise.all(
    (centers || []).map(async (center) => {
      const [sales, dqData, approvalRate] = await Promise.all([
        getTotalSalesVolume(yesterdayStr, center.id),
        getDQPercentage(yesterdayStr, center.id),
        getApprovalRate(yesterdayStr, center.id)
      ])

      return {
        center: center.center_name,
        sales,
        target: center.daily_sales_target,
        achievement: Math.round((sales / center.daily_sales_target) * 100),
        dqPercentage: dqData.percentage,
        approvalRate: approvalRate.rate
      }
    })
  )

  // Sort by achievement
  yesterdayPerformance.sort((a, b) => b.achievement - a.achievement)

  // Get top 3 and bottom 3
  const top3 = yesterdayPerformance.slice(0, 3)
  const bottom3 = yesterdayPerformance.slice(-3).reverse()

  // Get critical issues from yesterday
  const { data: criticalAlerts } = await supabase
    .from('alerts_sent')
    .select('*, centers(center_name)')
    .gte('sent_at', new Date(yesterdayStr).toISOString())
    .lt('sent_at', new Date(date).toISOString())
    .in('alert_type', ['zero_sales', 'high_dq'])
    .order('sent_at', { ascending: false })
    .limit(5)

  return {
    date,
    yesterdayDate: yesterdayStr,
    summary: {
      totalCenters: centers?.length || 0,
      centersOnTarget: yesterdayPerformance.filter(p => p.achievement >= 100).length,
      avgAchievement: Math.round(yesterdayPerformance.reduce((sum, p) => sum + p.achievement, 0) / yesterdayPerformance.length),
      totalSales: yesterdayPerformance.reduce((sum, p) => sum + p.sales, 0)
    },
    top3,
    bottom3,
    criticalIssues: criticalAlerts || [],
    todayTarget: (centers || []).reduce((sum, c) => sum + c.daily_sales_target, 0)
  }
}

/**
 * Build Mid-Day Check-in (01:00 PM)
 */
export async function buildMidDayCheckIn(date: string = new Date().toISOString().split('T')[0]) {
  const supabase = getSupabaseClient()

  // Get all active centers
  const { data: centers } = await supabase
    .from('centers')
    .select('*')
    .eq('status', true)

  // Get current performance
  const currentPerformance = await Promise.all(
    (centers || []).map(async (center) => {
      const [sales, dqData] = await Promise.all([
        getTotalSalesVolume(date, center.id),
        getDQPercentage(date, center.id)
      ])

      // At 1 PM, we should be at ~54% of daily target (13/24 hours)
      const expectedProgress = center.daily_sales_target * 0.54
      const actualProgress = (sales / center.daily_sales_target) * 100
      const isAtRisk = sales < expectedProgress * 0.75 // Less than 75% of expected

      return {
        center: center.center_name,
        sales,
        target: center.daily_sales_target,
        expectedAtThisHour: Math.round(expectedProgress),
        actualProgress: Math.round(actualProgress),
        isAtRisk,
        dqPercentage: dqData.percentage
      }
    })
  )

  // Identify at-risk centers
  const atRiskCenters = currentPerformance.filter(p => p.isAtRisk)

  // Get top performer
  const topPerformer = currentPerformance.reduce((max, p) =>
    p.actualProgress > max.actualProgress ? p : max, currentPerformance[0]
  )

  return {
    date,
    time: '1:00 PM',
    summary: {
      totalCenters: centers?.length || 0,
      onTrack: currentPerformance.filter(p => !p.isAtRisk).length,
      atRisk: atRiskCenters.length,
      totalSalesToday: currentPerformance.reduce((sum, p) => sum + p.sales, 0),
      totalTarget: (centers || []).reduce((sum, c) => sum + c.daily_sales_target, 0)
    },
    topPerformer,
    atRiskCenters,
    currentPerformance
  }
}

/**
 * Build End-of-Day Summary (05:00 PM)
 */
export async function buildEndOfDaySummary(date: string = new Date().toISOString().split('T')[0]) {
  const metrics = await getComprehensiveMetrics(date)
  const supabase = getSupabaseClient()

  // Get all active centers with performance
  const { data: centers } = await supabase
    .from('centers')
    .select('*')
    .eq('status', true)

  const centerPerformance = await Promise.all(
    (centers || []).map(async (center) => {
      const [sales, dqData, approvalRate] = await Promise.all([
        getTotalSalesVolume(date, center.id),
        getDQPercentage(date, center.id),
        getApprovalRate(date, center.id)
      ])

      return {
        center: center.center_name,
        sales,
        target: center.daily_sales_target,
        achievement: Math.round((sales / center.daily_sales_target) * 100),
        dqPercentage: dqData.percentage,
        approvalRate: approvalRate.rate,
        status: sales >= center.daily_sales_target ? 'Target Met ✅' :
          sales >= center.daily_sales_target * 0.8 ? 'Near Target ⚠️' : 'Below Target ❌'
      }
    })
  )

  // Get quality summary
  const { data: dqItems } = await supabase
    .from('dq_items')
    .select('dq_category')
    .gte('created_at', new Date(date).toISOString())

  const dqByCategory = (dqItems || []).reduce((acc: Record<string, number>, item) => {
    const category = item.dq_category || 'Unknown'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topDQIssues = Object.entries(dqByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }))

  return {
    date,
    overallMetrics: metrics,
    centerPerformance,
    summary: {
      centersMetTarget: centerPerformance.filter(p => p.achievement >= 100).length,
      centersNearTarget: centerPerformance.filter(p => p.achievement >= 80 && p.achievement < 100).length,
      centersBelowTarget: centerPerformance.filter(p => p.achievement < 80).length,
      avgAchievement: Math.round(centerPerformance.reduce((sum, p) => sum + p.achievement, 0) / centerPerformance.length)
    },
    qualitySummary: {
      totalDQItems: dqItems?.length || 0,
      topIssues: topDQIssues
    }
  }
}

/**
 * Build Weekly Report (Friday 05:00 PM)
 */
export async function buildWeeklyReport(weekEndDate: string = new Date().toISOString().split('T')[0]) {
  const supabase = getSupabaseClient()

  // Calculate week start (7 days before end)
  const weekStart = new Date(weekEndDate)
  weekStart.setDate(weekStart.getDate() - 6)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Get all active centers
  const { data: centers } = await supabase
    .from('centers')
    .select('*')
    .eq('status', true)

  // Get weekly performance for each center
  const weeklyPerformance = await Promise.all(
    (centers || []).map(async (center) => {
      const dailyPerf = await getCenterDailyPerformance(center.id, 7)

      const weekTotal = {
        sales: dailyPerf.reduce((sum, d) => sum + d.sales, 0),
        transfers: dailyPerf.reduce((sum, d) => sum + d.transfers, 0),
        dqItems: dailyPerf.reduce((sum, d) => sum + d.dqCount, 0),
        target: center.daily_sales_target * 7
      }

      return {
        center: center.center_name,
        ...weekTotal,
        achievement: Math.round((weekTotal.sales / weekTotal.target) * 100),
        avgDailyDQ: dailyPerf.length > 0 ?
          Math.round(dailyPerf.reduce((sum, d) => sum + d.dqPercentage, 0) / dailyPerf.length * 10) / 10 : 0,
        trend: dailyPerf.length >= 2 ?
          dailyPerf[dailyPerf.length - 1].sales > dailyPerf[0].sales ? '📈 Up' : '📉 Down' : '➡️ Stable'
      }
    })
  )

  // Sort by achievement
  weeklyPerformance.sort((a, b) => b.achievement - a.achievement)

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndDate,
    summary: {
      totalCenters: centers?.length || 0,
      totalSales: weeklyPerformance.reduce((sum, p) => sum + p.sales, 0),
      totalTarget: weeklyPerformance.reduce((sum, p) => sum + p.target, 0),
      avgAchievement: Math.round(weeklyPerformance.reduce((sum, p) => sum + p.achievement, 0) / weeklyPerformance.length)
    },
    top3: weeklyPerformance.slice(0, 3),
    bottom3: weeklyPerformance.slice(-3).reverse(),
    allCenters: weeklyPerformance
  }
}

/**
 * Build Monthly Report (Last Day of Month)
 */
export async function buildMonthlyReport(monthEndDate: string = new Date().toISOString().split('T')[0]) {
  const supabase = getSupabaseClient()

  // Calculate month start
  const monthEnd = new Date(monthEndDate)
  const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1)
  const monthStartStr = monthStart.toISOString().split('T')[0]
  const daysInMonth = Math.floor((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Get all active centers
  const { data: centers } = await supabase
    .from('centers')
    .select('*')
    .eq('status', true)

  // Get monthly performance
  const monthlyPerformance = await Promise.all(
    (centers || []).map(async (center) => {
      const dailyPerf = await getCenterDailyPerformance(center.id, daysInMonth)

      const monthTotal = {
        sales: dailyPerf.reduce((sum, d) => sum + d.sales, 0),
        transfers: dailyPerf.reduce((sum, d) => sum + d.transfers, 0),
        approvals: dailyPerf.reduce((sum, d) => sum + d.approvals, 0),
        dqItems: dailyPerf.reduce((sum, d) => sum + d.dqCount, 0),
        target: center.daily_sales_target * daysInMonth
      }

      return {
        center: center.center_name,
        ...monthTotal,
        achievement: Math.round((monthTotal.sales / monthTotal.target) * 100),
        avgDailyDQ: dailyPerf.length > 0 ?
          Math.round(dailyPerf.reduce((sum, d) => sum + d.dqPercentage, 0) / dailyPerf.length * 10) / 10 : 0,
        conversionRate: monthTotal.transfers > 0 ?
          Math.round((monthTotal.sales / monthTotal.transfers) * 100) : 0
      }
    })
  )

  // Rankings
  monthlyPerformance.sort((a, b) => b.achievement - a.achievement)

  return {
    monthStart: monthStartStr,
    monthEnd: monthEndDate,
    daysInMonth,
    summary: {
      totalCenters: centers?.length || 0,
      totalSales: monthlyPerformance.reduce((sum, p) => sum + p.sales, 0),
      totalTarget: monthlyPerformance.reduce((sum, p) => sum + p.target, 0),
      totalTransfers: monthlyPerformance.reduce((sum, p) => sum + p.transfers, 0),
      avgAchievement: Math.round(monthlyPerformance.reduce((sum, p) => sum + p.achievement, 0) / monthlyPerformance.length),
      overallConversion: monthlyPerformance.reduce((sum, p) => sum + p.sales, 0) /
        monthlyPerformance.reduce((sum, p) => sum + p.transfers, 0) * 100
    },
    rankings: monthlyPerformance,
    top3: monthlyPerformance.slice(0, 3),
    bottom3: monthlyPerformance.slice(-3).reverse()
  }
}

/**
 * Send Morning Brief Email
 */
export async function sendMorningBrief() {
  const report = await buildDailyMorningBrief()
  const html = generateMorningBriefHTML(report)

  // Get all managers and admins
  const supabase = getSupabaseClient()
  const { data: users } = await supabase
    .from('users')
    .select('email')
    .overlaps('role', ['admin', 'manager'])

  const recipients = users?.map(u => u.email) || []

  if (recipients.length > 0) {
    await sendEmail(
      recipients,
      `Daily Morning Brief - ${report.date}`,
      html
    )
  }
}

/**
 * Generate Morning Brief HTML
 */
function generateMorningBriefHTML(report: MorningBriefReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
    .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .metric { display: inline-block; margin: 10px 20px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 14px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #667eea; color: white; }
    .top { background: #d4edda; }
    .bottom { background: #f8d7da; }
  </style>
</head>
<body>
  <div class="header">
    <h1>☀️ Daily Morning Brief</h1>
    <p>${report.date}</p>
  </div>
  
  <div class="section">
    <h2>Yesterday's Performance (${report.yesterdayDate})</h2>
    <div class="metric">
      <div class="metric-value">${report.summary.totalSales}</div>
      <div class="metric-label">Total Sales</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.centersOnTarget}/${report.summary.totalCenters}</div>
      <div class="metric-label">Centers On Target</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.avgAchievement}%</div>
      <div class="metric-label">Avg Achievement</div>
    </div>
  </div>
  
  <div class="section">
    <h2>🏆 Top 3 Performers</h2>
    <table>
      <thead>
        <tr><th>Center</th><th>Sales</th><th>Target</th><th>Achievement</th></tr>
      </thead>
      <tbody>
        ${report.top3.map((p) => `
          <tr class="top">
            <td>${p.center}</td>
            <td>${p.sales}</td>
            <td>${p.target}</td>
            <td><strong>${p.achievement}%</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>⚠️ Bottom 3 Performers</h2>
    <table>
      <thead>
        <tr><th>Center</th><th>Sales</th><th>Target</th><th>Achievement</th></tr>
      </thead>
      <tbody>
        ${report.bottom3.map((p) => `
          <tr class="bottom">
            <td>${p.center}</td>
            <td>${p.sales}</td>
            <td>${p.target}</td>
            <td><strong>${p.achievement}%</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>🎯 Today's Target</h2>
    <div class="metric-value">${report.todayTarget}</div>
    <p>Total sales target across all centers</p>
  </div>
</body>
</html>
  `
}
