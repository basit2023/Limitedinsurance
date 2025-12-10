import { NextResponse } from 'next/server'
import { sendMultiChannelNotification } from '@/services/notificationDispatcher'

export async function POST(request: Request) {
    try {
        const { channels = ['slack', 'email'], message } = await request.json().catch(() => ({}))

        const testMessage = message || "🔔 TEST ALERT: This is a test notification from the Insurance Portal."

        const result = await sendMultiChannelNotification(
            channels,
            testMessage,
            {
                priority: 'high',
                centerName: 'Test Center',
                actionItems: ['Check dashboard', 'Verify logs'],
                dashboardUrl: 'http://localhost:3000/dashboard',
                recipients: ['test-admin@example.com']
            }
        )

        return NextResponse.json({
            success: true,
            message: 'Test notification triggered',
            details: result
        })
    } catch (error) {
        console.error('Test notification failed:', error)
        return NextResponse.json(
            { error: 'Failed to trigger test notification' },
            { status: 500 }
        )
    }
}
