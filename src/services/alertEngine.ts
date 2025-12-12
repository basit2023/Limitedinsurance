import { createClient } from '@supabase/supabase-js'
import {
  getTotalSalesVolume,
  getDQPercentage,
  getApprovalRatioTransferVsSubmission,
  getTransferCount
} from './metricsService'
import { sendMultiChannelNotification } from './notificationDispatcher'

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

interface AlertRule {
  id: string
  rule_name: string
  trigger_type: 'low_sales' | 'zero_sales' | 'high_dq' | 'low_approval' | 'milestone' | 'below_threshold_duration'
  condition_threshold: number
  alert_message_template: string
  recipient_roles: string[]
  channels: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

interface Center {
  id: string
  center_name: string
  daily_sales_target: number
  location: string
  region: string
}

/**
 * Main function to evaluate all centers and trigger alerts
 */
export async function evaluateAllCenters(date: string = new Date().toISOString().split('T')[0]) {
  const supabase = getSupabaseClient()

  try {
    // Get all active centers
    const { data: centers, error: centersError } = await supabase
      .from('centers')
      .select('*')
      .eq('status', true)

    if (centersError) throw centersError

    // Get all enabled alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true)

    if (rulesError) throw rulesError

    // Check if we're in quiet hours
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    // Evaluate each center against each rule
    for (const center of (centers || [])) {
      for (const rule of (rules || [])) {
        // Skip if in quiet hours
        if (rule.quiet_hours_start && rule.quiet_hours_end) {
          if (currentTime >= rule.quiet_hours_start && currentTime <= rule.quiet_hours_end) {
            continue
          }
        }

        await evaluateRule(rule, center, date)
      }
    }

    console.log(`Alert evaluation completed for ${date}. Checked ${centers?.length || 0} centers against ${rules?.length || 0} rules.`)
  } catch (error) {
    console.error('Error evaluating centers:', error)
    throw error
  }
}

/**
 * Evaluate a single center
 */
export async function checkSingleCenter(centerId: string, date: string = new Date().toISOString().split('T')[0]) {
  const supabase = getSupabaseClient()

  try {
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('*')
      .eq('id', centerId)
      .single()

    if (centerError || !center) return

    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true)

    if (rulesError) return

    for (const rule of (rules || [])) {
      await evaluateRule(rule, center, date)
    }
  } catch (error) {
    console.error('Error in checkSingleCenter:', error)
  }
}

/**
 * Evaluate a specific rule against a center
 */
async function evaluateRule(rule: AlertRule, center: Center, date: string) {
  const supabase = getSupabaseClient()

  try {
    switch (rule.trigger_type) {
      case 'low_sales':
        await checkLowSalesVolume(rule, center, date)
        break
      case 'zero_sales':
        await checkZeroSalesAlert(rule, center, date)
        break
      case 'high_dq':
        await checkHighDQRate(rule, center, date)
        break
      case 'low_approval':
        await checkLowApprovalRatio(rule, center, date)
        break
      case 'milestone':
        await checkMilestoneAchievement(rule, center, date)
        break
      case 'below_threshold_duration':
        await checkBelowThresholdDuration(rule, center, date)
        break
    }
  } catch (error) {
    console.error(`Error evaluating rule ${rule.rule_name} for center ${center.center_name}:`, error)
  }
}

/**
 * Check if sales volume is below threshold
 */
async function checkLowSalesVolume(rule: AlertRule, center: Center, date: string) {
  const sales = await getTotalSalesVolume(date, center.id)
  const targetPercentage = (sales / center.daily_sales_target) * 100

  if (targetPercentage < rule.condition_threshold) {
    const hoursRemaining = getHoursRemainingInDay()
    const message = rule.alert_message_template
      .replace('[Center]', center.center_name)
      .replace('[SalesCount]', sales.toString())
      .replace('[Target]', center.daily_sales_target.toString())
      .replace('[HoursRemaining]', hoursRemaining.toString())
      .replace('[Percentage]', Math.round(targetPercentage).toString())

    await triggerAlert(rule, center, message, { sales, target: center.daily_sales_target, percentage: targetPercentage })
  }
}

/**
 * Check for zero sales (CRITICAL)
 */
async function checkZeroSalesAlert(rule: AlertRule, center: Center, date: string) {
  const sales = await getTotalSalesVolume(date, center.id)

  if (sales === 0) {
    const currentHour = new Date().getHours()

    // Only trigger if it's past noon and still no sales
    if (currentHour >= 12) {
      const message = rule.alert_message_template
        .replace('[Center]', center.center_name)
        .replace('[Time]', `${currentHour}:00`)

      await triggerAlert(rule, center, message, { sales: 0, time: currentHour })
    }
  }
}

/**
 * Check if DQ rate is too high
 */
async function checkHighDQRate(rule: AlertRule, center: Center, date: string) {
  const dqData = await getDQPercentage(date, center.id)

  if (dqData.percentage > rule.condition_threshold) {
    // Get top DQ issues
    const supabase = getSupabaseClient()
    const { data: topIssues } = await supabase
      .from('dq_items')
      .select('dq_category')
      .eq('center_id', center.id)
      .gte('created_at', new Date(date).toISOString())
      .limit(3)

    const issues = topIssues?.map(i => i.dq_category).join(', ') || 'Unknown'

    const message = rule.alert_message_template
      .replace('[Center]', center.center_name)
      .replace('[DQPercentage]', Math.round(dqData.percentage).toString())
      .replace('[DQCount]', dqData.count.toString())
      .replace('[TopIssues]', issues)

    await triggerAlert(rule, center, message, { dqPercentage: dqData.percentage, dqCount: dqData.count, topIssues: issues })
  }
}

/**
 * Check if approval ratio is too low
 */
async function checkLowApprovalRatio(rule: AlertRule, center: Center, date: string) {
  const approvalRatio = await getApprovalRatioTransferVsSubmission(date, center.id)

  if (approvalRatio.ratio < rule.condition_threshold) {
    const message = rule.alert_message_template
      .replace('[Center]', center.center_name)
      .replace('[ApprovalRatio]', Math.round(approvalRatio.ratio).toString())
      .replace('[SubmissionCount]', approvalRatio.submissions.toString())
      .replace('[UWCount]', approvalRatio.transfers.toString())

    await triggerAlert(rule, center, message, {
      approvalRatio: approvalRatio.ratio,
      submissions: approvalRatio.submissions,
      uw: approvalRatio.transfers
    })
  }
}

/**
 * Check for milestone achievements (positive alerts)
 */
async function checkMilestoneAchievement(rule: AlertRule, center: Center, date: string) {
  const sales = await getTotalSalesVolume(date, center.id)
  const targetPercentage = (sales / center.daily_sales_target) * 100

  // Check for 75%, 100%, 125% milestones
  const milestones = [75, 100, 125, 150]

  for (const milestone of milestones) {
    if (targetPercentage >= milestone && targetPercentage < milestone + 5) {
      const message = rule.alert_message_template
        .replace('[Center]', center.center_name)
        .replace('[Milestone]', `${milestone}%`)
        .replace('[SalesCount]', sales.toString())
        .replace('[Target]', center.daily_sales_target.toString())

      await triggerAlert(rule, center, message, {
        sales,
        target: center.daily_sales_target,
        milestone,
        percentage: targetPercentage
      })
      break
    }
  }
}

/**
 * Check if center has been below threshold for X consecutive hours
 */
async function checkBelowThresholdDuration(rule: AlertRule, center: Center, date: string) {
  const supabase = getSupabaseClient()

  // Get hourly sales for today
  const { data: hourlyData } = await supabase
    .from('daily_deal_flow')
    .select('date, status, call_result')
    .eq('center_id', center.id)
    .eq('date', date)
    .in('status', ['Pending Approval'])
    .in('call_result', ['Submitted', 'Underwriting'])

  // Count sales by hour
  const salesByHour: { [hour: number]: number } = {}
  const currentHour = new Date().getHours()

  for (let hour = 0; hour <= currentHour; hour++) {
    salesByHour[hour] = 0
  }

  // This is simplified - in production, you'd parse created_at timestamps
  const currentSales = hourlyData?.length || 0
  const proportionalTarget = (center.daily_sales_target / 24) * currentHour

  if (currentSales < proportionalTarget * (rule.condition_threshold / 100)) {
    const message = rule.alert_message_template
      .replace('[Center]', center.center_name)
      .replace('[Hours]', currentHour.toString())
      .replace('[SalesCount]', currentSales.toString())
      .replace('[Target]', center.daily_sales_target.toString())

    await triggerAlert(rule, center, message, {
      sales: currentSales,
      target: center.daily_sales_target,
      hours: currentHour
    })
  }
}

/**
 * Trigger an alert and log it to the database
 */
async function triggerAlert(
  rule: AlertRule,
  center: Center,
  message: string,
  metadata: any = {}
) {
  const supabase = getSupabaseClient()

  console.log(`Triggering alert for ${center.center_name}: ${rule.rule_name}`)

  try {
    // Check if we've sent this alert recently (frequency cap)
    // Reduce cap to 5 minutes so testing is easier
    const capTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentAlerts } = await supabase
      .from('alerts_sent')
      .select('id')
      .eq('rule_id', rule.id)
      .eq('center_id', center.id)
      .gte('sent_at', capTime)
      .limit(1)

    if (recentAlerts && recentAlerts.length > 0) {
      console.log(`Alert for ${center.center_name} suppressed due to frequency cap`)
      return
    }

    // Get recipients based on roles
    // Join user_types to filter by role name
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_types!inner(name)')

    if (userError) {
      console.error('Error fetching users for alert:', userError)
    }

    // Filter for Admin Owner to ensure only they get notifications as per request
    // This overrides the rule's recipient_roles for now, or ensures we only match Admin Owner
    const matchRole = 'Admin Owner'.toLowerCase()
    const validUsers = users?.filter((u: any) =>
      u.user_types &&
      u.user_types.name.toLowerCase() === matchRole
    ) || []

    if (validUsers.length === 0) {
      console.log('No Admin Owner users found to receive alert')
      return
    }

    const recipients = validUsers.map((u: any) => u.email)

    // Log the alert
    const { error: insertError } = await supabase
      .from('alerts_sent')
      .insert({
        rule_id: rule.id,
        center_id: center.id,
        alert_type: rule.trigger_type,
        message,
        channels_sent: rule.channels,
        recipients,
        sent_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error logging alert:', insertError)
      return
    }

    // Send notifications via dispatcher
    console.log(`🔔 ALERT LOGGED: ${message}`)
    console.log(`   Recipients: ${recipients.join(', ')}`)

    await sendMultiChannelNotification(
      rule.channels,
      message,
      {
        centerName: center.center_name,
        priority: rule.priority,
        userId: validUsers[0]?.id, // For push notifications
        recipients,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    )

  } catch (error) {
    console.error('Error triggering alert:', error)
  }
}

/**
 * Helper function to get hours remaining in the day
 */
function getHoursRemainingInDay(): number {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const hoursRemaining = Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60))
  return Math.max(0, hoursRemaining)
}

/**
 * Get alert history for a center
 */
export async function getAlertHistory(centerId: string, days: number = 7) {
  const supabase = getSupabaseClient()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('alerts_sent')
    .select('*, alert_rules(*)')
    .eq('center_id', centerId)
    .gte('sent_at', startDate)
    .order('sent_at', { ascending: false })

  if (error) throw error

  return data
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string, userId: string, action?: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('alerts_sent')
    .update({
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      response_action: action
    })
    .eq('id', alertId)

  if (error) throw error
}
