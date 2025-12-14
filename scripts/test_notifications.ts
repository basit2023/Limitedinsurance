/**
 * Test Notification System
 * This script tests all notification channels for the insurance alert system
 */

import 'dotenv/config'
import { sendSlackMessage, sendEmail, sendWebPushNotification } from '../src/services/notificationDispatcher'
import { createCenterSlackChannel } from '../src/services/slackChannelService'

async function testNotifications() {
    console.log('🧪 Testing Insurance Alert Notification System\n')

    // Test Slack Notifications
    console.log('📢 Testing Slack Notifications...')
    try {
        const slackResult = await sendSlackMessage(
            'sales',
            '🎯 **Test Notification**\n\nThis is a test message to verify Slack integration is working correctly.',
            {
                centerName: 'Test Center',
                priority: 'medium',
                actionItems: [
                    'Verify message appears in Slack channel',
                    'Check message formatting',
                    'Confirm webhook is configured correctly'
                ],
                dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            }
        )

        if (slackResult.success) {
            console.log('✅ Slack notification sent successfully')
            if ('mocked' in slackResult && slackResult.mocked) {
                console.log('⚠️  Slack webhook not configured - message was logged to console')
            }
        } else {
            console.log('❌ Slack notification failed:', 'error' in slackResult ? slackResult.error : 'Unknown error')
        }
    } catch (error) {
        console.error('❌ Slack test error:', error)
    }

    console.log('\n')

    // Test Slack Channel Creation
    console.log('🏢 Testing Slack Channel Creation...')
    try {
        const channelResult = await createCenterSlackChannel('Test Center', 'test-center-123')

        if (channelResult.error) {
            console.log('⚠️  Channel creation not available:', channelResult.error)
        } else {
            console.log('✅ Slack channel created/found:', channelResult.channelName)
            console.log('   Channel ID:', channelResult.channelId)
        }
    } catch (error) {
        console.error('❌ Channel creation error:', error)
    }

    console.log('\n')

    // Test Email Notifications
    console.log('📧 Testing Email Notifications...')
    try {
        const emailRecipient = process.env.TEST_EMAIL || 'test@example.com'

        const emailResult = await sendEmail(
            [emailRecipient],
            'Test Alert - Insurance Sales Portal',
            `
                <h1>Test Notification</h1>
                <p>This is a test email to verify email notification integration.</p>
                <p><strong>Center:</strong> Test Center</p>
                <p><strong>Priority:</strong> Medium</p>
                <p>If you receive this email, your email integration is working correctly.</p>
            `,
            'Test Notification - This is a test email to verify email notification integration.'
        )

        if (emailResult.success) {
            console.log('✅ Email sent successfully')
            console.log('   Recipient:', emailRecipient)
            if ('mocked' in emailResult && emailResult.mocked) {
                console.log('⚠️  SMTP not configured - message was logged to console')
            } else if ('messageId' in emailResult) {
                console.log('   Message ID:', emailResult.messageId)
            }
        } else {
            console.log('❌ Email failed:', 'error' in emailResult ? emailResult.error : 'Unknown error')
        }
    } catch (error) {
        console.error('❌ Email test error:', error)
    }

    console.log('\n')

    // Test PWA Push Notifications (requires user ID)
    console.log('📱 Testing PWA Push Notifications...')
    try {
        const testUserId = process.env.TEST_USER_ID

        if (!testUserId) {
            console.log('⚠️  TEST_USER_ID not set in environment - skipping push test')
            console.log('   Set TEST_USER_ID to test push notifications')
        } else {
            const pushResult = await sendWebPushNotification(
                testUserId,
                {
                    title: 'Test Alert',
                    body: 'This is a test push notification from the Insurance Sales Portal',
                    priority: 'normal',
                    data: {
                        centerName: 'Test Center',
                        url: '/dashboard'
                    }
                }
            )

            if (pushResult.success) {
                console.log('✅ Push notification sent successfully')
                if ('mocked' in pushResult && pushResult.mocked) {
                    console.log('⚠️  VAPID keys not configured - message was logged to console')
                }
            } else {
                console.log('❌ Push notification failed:', 'error' in pushResult ? pushResult.error : 'Unknown error')
            }
        }
    } catch (error) {
        console.error('❌ Push test error:', error)
    }

    console.log('\n')

    // Configuration Summary
    console.log('⚙️  Configuration Summary:')
    console.log('----------------------------')
    console.log('Slack Sales Webhook:', process.env.SLACK_WEBHOOK_SALES_ALERTS ? '✅ Configured' : '❌ Not set')
    console.log('Slack Quality Webhook:', process.env.SLACK_WEBHOOK_QUALITY_ALERTS ? '✅ Configured' : '❌ Not set')
    console.log('Slack Critical Webhook:', process.env.SLACK_WEBHOOK_CRITICAL_ALERTS ? '✅ Configured' : '❌ Not set')
    console.log('Slack Bot Token:', process.env.SLACK_BOT_TOKEN ? '✅ Configured' : '❌ Not set')
    console.log('SMTP Host:', process.env.SMTP_HOST ? '✅ Configured' : '❌ Not set')
    console.log('SMTP User:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not set')
    console.log('VAPID Public Key:', process.env.VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Not set')
    console.log('VAPID Private Key:', process.env.VAPID_PRIVATE_KEY ? '✅ Configured' : '❌ Not set')
    console.log('Supabase URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Not set')

    console.log('\n✨ Notification system test complete!\n')
}

// Run tests
testNotifications().catch(console.error)
