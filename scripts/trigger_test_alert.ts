import { config } from 'dotenv'
import { sendMultiChannelNotification } from '../src/services/notificationDispatcher'

// Load environment variables
config()

async function triggerTestAlert() {
  console.log('🚨 Triggering Test Alert for Dallas BPO Center\n')
  
  const message = `🚨 *TEST ALERT* 🚨
  
*Dallas BPO Center* - Low Sales Alert
Current: 40/50 sales (80%)
Hours Remaining: 5

This is a test notification to verify:
✅ Email delivery
✅ Slack channel creation (#center-dallas-bpo-center)
✅ Push notifications`

  const metadata = {
    centerName: 'Dallas BPO Center',
    centerId: '1', // Dallas center ID
    priority: 'high',
    recipients: ['babaralibj362@gmail.com'],
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://limitedinsurance-f1v9.vercel.app'}/dashboard`,
    triggerType: 'low_sales' as const,
    actionItems: [
      'Check sales pipeline',
      'Review agent performance',
      'Implement immediate action plan'
    ]
  }

  console.log('📤 Sending notifications via:')
  console.log('  - Email')
  console.log('  - Slack (will create #center-dallas-bpo-center if not exists)')
  console.log('  - Push (to subscribed browsers)\n')

  try {
    await sendMultiChannelNotification(
      ['email', 'slack', 'push'],
      message,
      metadata
    )
    
    console.log('\n✅ Test alert sent successfully!')
    console.log('\nCheck:')
    console.log('1. Your email inbox for the alert')
    console.log('2. Slack workspace for #center-dallas-bpo-center channel')
    console.log('3. Your browser for push notification (if subscribed)')
    
  } catch (error) {
    console.error('❌ Error sending test alert:', error)
  }
}

triggerTestAlert().catch(console.error)
