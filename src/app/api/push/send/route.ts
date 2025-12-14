import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
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

// Configure VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, title, body: messageBody, data, priority } = body

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.warn('VAPID keys not configured, skipping push notification')
            return NextResponse.json(
                { success: false, error: 'VAPID keys not configured' },
                { status: 500 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseClient()

        // Get all active subscriptions for the user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            console.error('Error fetching subscriptions:', error)
            return NextResponse.json(
                { error: 'Failed to fetch subscriptions' },
                { status: 500 }
            )
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json(
                { success: true, message: 'No active subscriptions found' }
            )
        }

        // Prepare notification payload
        const payload = JSON.stringify({
            title: title || 'Insurance Alert',
            body: messageBody || 'New alert received',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'insurance-alert',
            priority: priority || 'normal',
            data: data || { url: '/dashboard' }
        })

        // Send push notification to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh_key,
                            auth: sub.auth_key
                        }
                    }

                    await webpush.sendNotification(pushSubscription, payload)
                    return { success: true, endpoint: sub.endpoint }
                } catch (error: unknown) {
                    console.error('Error sending push to endpoint:', sub.endpoint, error)

                    // If subscription is invalid, mark as inactive
                    if (error && typeof error === 'object' && 'statusCode' in error) {
                        const statusCode = (error as { statusCode: number }).statusCode
                        if (statusCode === 410 || statusCode === 404) {
                            await supabase
                                .from('push_subscriptions')
                                .update({ is_active: false })
                                .eq('endpoint', sub.endpoint)
                        }
                    }

                    return { success: false, endpoint: sub.endpoint, error }
                }
            })
        )

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
        const failed = results.length - successful

        console.log(`📱 Push notifications sent: ${successful} successful, ${failed} failed`)

        return NextResponse.json({
            success: true,
            sent: successful,
            failed,
            total: results.length
        })

    } catch (error) {
        console.error('Error in push send endpoint:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
