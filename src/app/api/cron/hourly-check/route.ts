import { NextResponse } from 'next/server'
import { evaluateAllCenters } from '@/services/alertEngine'

/**
 * Hourly threshold check endpoint
 * Called by Vercel Cron every hour to check if sales are on track
 * 
 * GET /api/cron/hourly-check
 */
export async function GET(request: Request) {
    try {
        // Verify the request is from Vercel Cron
        const authHeader = request.headers.get('authorization')

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        console.log(`[HOURLY CHECK] Starting hourly threshold check at ${new Date().toISOString()}`)

        const today = new Date().toISOString().split('T')[0]

        // Run full alert evaluation (includes hourly threshold checks)
        await evaluateAllCenters(today)

        console.log('[HOURLY CHECK] Hourly threshold check completed successfully')

        return NextResponse.json({
            success: true,
            message: 'Hourly threshold check completed',
            timestamp: new Date().toISOString(),
            date: today
        })
    } catch (error) {
        console.error('[HOURLY CHECK] Error in hourly threshold check:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
    return GET(request)
}
