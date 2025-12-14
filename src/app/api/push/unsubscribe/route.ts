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
        const { endpoint } = body

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Missing endpoint' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseClient()

        // Mark subscription as inactive instead of deleting
        const { error } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', endpoint)

        if (error) {
            console.error('Error unsubscribing:', error)
            return NextResponse.json(
                { error: 'Failed to unsubscribe' },
                { status: 500 }
            )
        }

        console.log('✅ Push unsubscription successful')
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error in push unsubscribe endpoint:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
