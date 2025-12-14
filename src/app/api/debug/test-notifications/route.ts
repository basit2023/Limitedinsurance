import { NextResponse } from 'next/server'
import { sendSlackMessage, sendEmail, sendWebPushNotification } from '@/services/notificationDispatcher'

/**
 * Debug endpoint to test all notification channels
 * GET /api/debug/test-notifications
 */
export async function GET() {
    const results: any[] = []

    try {
        // Test Slack
        console.log('Testing Slack notifications...')
        const slackResult = await sendSlackMessage(
            'sales',
            '🧪 **Test Notification**\n\nThis is a test message from the notification system.',
            {
                centerName: 'Test Center',
                priority: 'medium',
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
            }
        )
        results.push({
            channel: 'slack',
            ...slackResult,
            configured: !!process.env.SLACK_WEBHOOK_SALES_ALERTS
        })

        // Test Email
        console.log('Testing email notifications...')
        const emailResult = await sendEmail(
            ['test@example.com'],
            'Test Notification',
            '<h1>Test Email</h1><p>This is a test email from the notification system.</p>'
        )
        results.push({
            channel: 'email',
            ...emailResult,
            configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
        })

        // Test Web Push
        console.log('Testing web push notifications...')
        const pushResult = await sendWebPushNotification(
            'test-user-id',
            {
                title: 'Test Notification',
                body: 'This is a test push notification',
                priority: 'normal'
            }
        )
        results.push({
            channel: 'web-push',
            ...pushResult,
            configured: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
        })

        // Environment variables check
        const envCheck = {
            supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
            slack_sales: !!process.env.SLACK_WEBHOOK_SALES_ALERTS,
            slack_quality: !!process.env.SLACK_WEBHOOK_QUALITY_ALERTS,
            slack_critical: !!process.env.SLACK_WEBHOOK_CRITICAL_ALERTS,
            smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
            vapid: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
            app_url: !!process.env.NEXT_PUBLIC_APP_URL
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            results,
            environmentVariables: envCheck,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                mocked: results.filter(r => r.mocked).length
            }
        })
    } catch (error) {
        console.error('Error testing notifications:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                results
            },
            { status: 500 }
        )
    }
}
