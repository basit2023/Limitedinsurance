import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCenterSlackChannel, inviteUsersToChannel } from '@/services/slackChannelService'

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
 * POST /api/admin/slack-channels
 * Create Slack channels for all centers or a specific center
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { centerId, inviteUsers } = body

        const supabase = getSupabaseClient()

        // Get centers
        let query = supabase.from('centers').select('id, center_name')

        if (centerId) {
            query = query.eq('id', centerId)
        }

        const { data: centers, error: centersError } = await query

        if (centersError) {
            return NextResponse.json(
                { error: centersError.message },
                { status: 500 }
            )
        }

        if (!centers || centers.length === 0) {
            return NextResponse.json(
                { error: 'No centers found' },
                { status: 404 }
            )
        }

        const results = []

        for (const center of centers) {
            const result = await createCenterSlackChannel(center.center_name, center.id)

            // If inviteUsers is true and we have a channel ID, invite users
            if (inviteUsers && result.channelId && !result.error) {
                // Get users with permission to receive alerts
                const { data: users } = await supabase
                    .from('users')
                    .select(`
                        email,
                        user_types!inner(permission_level)
                    `)
                    .eq('status', true)

                const validUsers = users?.filter((u: any) =>
                    u.user_types && u.user_types.permission_level > 15
                ) || []

                if (validUsers.length > 0) {
                    const emails = validUsers.map((u: any) => u.email)
                    await inviteUsersToChannel(result.channelId, emails)
                }
            }

            results.push({
                centerId: center.id,
                centerName: center.center_name,
                ...result
            })
        }

        return NextResponse.json({
            success: true,
            results
        })

    } catch (error) {
        console.error('Error creating Slack channels:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/slack-channels
 * Get Slack channel status for centers
 */
export async function GET() {
    try {
        const supabase = getSupabaseClient()

        const { data: centers, error } = await supabase
            .from('centers')
            .select('id, center_name, slack_webhook_url')

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            centers: centers?.map(c => ({
                id: c.id,
                name: c.center_name,
                hasWebhook: !!c.slack_webhook_url
            }))
        })

    } catch (error) {
        console.error('Error fetching Slack channel status:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
