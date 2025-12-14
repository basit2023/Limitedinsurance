import { NextResponse } from 'next/server'
import { sendMultiChannelNotification } from '@/services/notificationDispatcher'
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
 * Webhook endpoint for new sale notifications
 * Called by Supabase database trigger when new entry is inserted
 * 
 * POST /api/sales/notify
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { centerId, salesData, type = 'new_entry' } = body

        if (!centerId || !salesData) {
            return NextResponse.json(
                { error: 'Missing required fields: centerId, salesData' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseClient()

        // Get center details
        const { data: center, error: centerError } = await supabase
            .from('centers')
            .select('center_name, slack_webhook_url')
            .eq('id', centerId)
            .single()

        if (centerError || !center) {
            console.error('Center not found:', centerId)
            return NextResponse.json(
                { error: 'Center not found' },
                { status: 404 }
            )
        }

        // Get users with permission_level > 15
        const { data: users } = await supabase
            .from('users')
            .select(`
        id,
        email,
        user_types!inner(permission_level)
      `)
            .eq('status', true)

        const validUsers = users?.filter((u: any) =>
            u.user_types && u.user_types.permission_level > 15
        ) || []

        if (validUsers.length === 0) {
            console.log('No users with permission_level > 15 to notify')
            return NextResponse.json({ success: true, message: 'No recipients found' })
        }

        // Build notification message
        const agent = salesData.agent || 'Unknown Agent'
        const clientName = salesData.insured_name || salesData.client_name || 'Unknown Client'
        const premium = salesData.monthly_premium ? `$${salesData.monthly_premium}` : 'N/A'
        const status = salesData.status || 'Pending'
        const callResult = salesData.call_result || 'Submitted'

        const message = `📊 **New Sale Entry**\n\n` +
            `🏢 Center: ${center.center_name}\n` +
            `👤 Agent: ${agent}\n` +
            `👥 Client: ${clientName}\n` +
            `💰 Premium: ${premium}\n` +
            `📋 Status: ${status} - ${callResult}\n` +
            `⏰ Time: ${new Date().toLocaleString()}`

        // Send notifications
        const recipients = validUsers.map((u: any) => u.email)

        await sendMultiChannelNotification(
            ['slack', 'email', 'push'],
            message,
            {
                centerName: center.center_name,
                priority: 'medium',
                recipients,
                userId: validUsers[0]?.id,
                slackWebhookUrl: center.slack_webhook_url || undefined,
                centerId,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
            }
        )

        console.log(`✅ New sale notification sent for ${center.center_name}`)

        return NextResponse.json({
            success: true,
            message: 'Notification sent successfully',
            recipients: recipients.length
        })
    } catch (error) {
        console.error('Error sending new sale notification:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
