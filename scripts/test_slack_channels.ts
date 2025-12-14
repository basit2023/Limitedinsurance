import { config } from 'dotenv'
import { createCenterSlackChannel, sendSlackChannelMessage } from '../src/services/slackChannelService'

// Load environment variables
config()

async function testSlackChannels() {
  console.log('🧪 Testing Slack Channel Creation\n')
  
  // Check if SLACK_BOT_TOKEN is set
  const botToken = process.env.SLACK_BOT_TOKEN
  if (!botToken) {
    console.error('❌ SLACK_BOT_TOKEN not found in environment')
    console.log('Please set it in your .env file')
    return
  }
  
  console.log('✅ SLACK_BOT_TOKEN found')
  console.log(`Token: ${botToken.substring(0, 15)}...`)
  
  // Test creating a channel for Dallas BPO Center
  console.log('\n📍 Testing: Dallas BPO Center')
  const result = await createCenterSlackChannel('Dallas BPO Center', 'test-center-id-123')
  
  if (result.error) {
    console.error('❌ Error:', result.error)
  } else {
    console.log('✅ Channel created/found:', result.channelId)
    console.log('Channel name:', result.channelName)
    
    // Try sending a test message
    if (result.channelId) {
      console.log('\n📨 Sending test message...')
      const msgResult = await sendSlackChannelMessage(
        result.channelId,
        '🧪 Test message from Slack channel integration!',
        {
          centerName: 'Dallas BPO Center',
          priority: 'medium',
          dashboardUrl: 'https://limitedinsurance-f1v9.vercel.app/dashboard'
        }
      )
      
      if (msgResult.success) {
        console.log('✅ Message sent successfully!')
      } else {
        console.error('❌ Failed to send message:', msgResult.error)
      }
    }
  }
}

testSlackChannels().catch(console.error)
