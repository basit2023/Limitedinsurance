import cron from 'node-cron'
import { evaluateAllCenters } from './src/services/alertEngine'
import { sendMorningBrief } from './src/services/reportService'

/**
 * Scheduler for automated alerts and reports
 * This file should be run as a separate Node.js process in production
 */

console.log('🕐 Insurance Alert Portal Scheduler Started')
console.log(`   Time: ${new Date().toLocaleString()}`)
console.log('----------------------------------------')

// Alert checks every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Running alert evaluation...`)
  try {
    const today = new Date().toISOString().split('T')[0]
    await evaluateAllCenters(today)
    console.log('✅ Alert evaluation completed successfully')
  } catch (error) {
    console.error('❌ Error in alert evaluation:', error)
  }
})

// Daily Morning Brief - 08:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Sending Daily Morning Brief...`)
  try {
    await sendMorningBrief()
    console.log('✅ Morning brief sent successfully')
  } catch (error) {
    console.error('❌ Error sending morning brief:', error)
  }
})

// Mid-Day Check-in - 01:00 PM
cron.schedule('0 13 * * *', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Sending Mid-Day Check-in...`)
  try {
    // Import and call buildMidDayCheckIn
    const { buildMidDayCheckIn } = await import('./src/services/reportService')
    const report = await buildMidDayCheckIn()
    console.log('✅ Mid-day check-in generated:', report)
    // Send via notification dispatcher
  } catch (error) {
    console.error('❌ Error in mid-day check-in:', error)
  }
})

// End-of-Day Summary - 05:00 PM
cron.schedule('0 17 * * *', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Sending End-of-Day Summary...`)
  try {
    // Import and call buildEndOfDaySummary
    const { buildEndOfDaySummary } = await import('./src/services/reportService')
    const report = await buildEndOfDaySummary()
    console.log('✅ End-of-day summary generated:', report)
    // Send via notification dispatcher
  } catch (error) {
    console.error('❌ Error in end-of-day summary:', error)
  }
})

// Weekly Report - Friday 05:00 PM
cron.schedule('0 17 * * 5', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Sending Weekly Report...`)
  try {
    // Import and call buildWeeklyReport
    const { buildWeeklyReport } = await import('./src/services/reportService')
    const report = await buildWeeklyReport()
    console.log('✅ Weekly report generated:', report)
    // Send via notification dispatcher
  } catch (error) {
    console.error('❌ Error in weekly report:', error)
  }
})

// Monthly Report - Last day of month, 05:00 PM
cron.schedule('0 17 L * *', async () => {
  console.log(`\n[${new Date().toLocaleTimeString()}] Sending Monthly Report...`)
  try {
    // Import and call buildMonthlyReport
    const { buildMonthlyReport } = await import('./src/services/reportService')
    const report = await buildMonthlyReport()
    console.log('✅ Monthly report generated:', report)
    // Send via notification dispatcher
  } catch (error) {
    console.error('❌ Error in monthly report:', error)
  }
})

console.log('\n📅 Scheduled Jobs:')
console.log('   - Alert Evaluation: Every 5 minutes')
console.log('   - Morning Brief: Daily at 08:00 AM')
console.log('   - Mid-Day Check: Daily at 01:00 PM')
console.log('   - End-of-Day Summary: Daily at 05:00 PM')
console.log('   - Weekly Report: Friday at 05:00 PM')
console.log('   - Monthly Report: Last day of month at 05:00 PM')
console.log('----------------------------------------\n')

// Keep the process running
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing scheduler')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing scheduler')
  process.exit(0)
})
