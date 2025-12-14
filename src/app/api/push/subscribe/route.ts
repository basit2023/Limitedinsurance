import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { endpoint, keys, userId } = body

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json(
                { error: 'Missing required subscription data' },
                { status: 400 }
            )
        }

        // Get user ID from session or request
        // For now, we'll use the userId from the request
        // In production, you should validate this from the session
        const actualUserId = userId || request.headers.get('x-user-id')

        if (!actualUserId) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        const supabase = getSupabaseClient()

        // Check if subscription already exists
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', endpoint)
            .single()

        if (existing) {
            // Update existing subscription
            const { error: updateError } = await supabase
                .from('push_subscriptions')
                .update({
                    p256dh_key: keys.p256dh,
                    auth_key: keys.auth,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('endpoint', endpoint)

            if (updateError) {
                console.error('Error updating subscription:', updateError)
                return NextResponse.json(
                    { error: 'Failed to update subscription' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, updated: true })
        }

        // Create new subscription
        const { error: insertError } = await supabase
            .from('push_subscriptions')
            .insert({
                user_id: actualUserId,
                endpoint,
                p256dh_key: keys.p256dh,
                auth_key: keys.auth,
                user_agent: request.headers.get('user-agent') || 'Unknown',
                is_active: true
            })

        if (insertError) {
            console.error('Error saving subscription:', insertError)
            return NextResponse.json(
                { error: 'Failed to save subscription' },
                { status: 500 }
            )
        }

        console.log('✅ Push subscription saved successfully')
        return NextResponse.json({ success: true, created: true })

    } catch (error) {
        console.error('Error in push subscribe endpoint:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
