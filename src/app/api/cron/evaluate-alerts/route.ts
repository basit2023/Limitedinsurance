import { NextResponse } from 'next/server'
import { evaluateAllCenters } from '@/services/alertEngine'

/**
 * Vercel Cron Job endpoint
 * This endpoint is called by Vercel Cron every 5 minutes to evaluate alerts
 * 
 * GET /api/cron/evaluate-alerts
 */
export async function GET(request: Request) {
    try {
        // Verify the request is from Vercel Cron
        const authHeader = request.headers.get('authorization')

        // In production, Vercel Cron sends a special header
        // For local testing, we'll allow requests without auth
        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        console.log(`[CRON] Starting alert evaluation at ${new Date().toISOString()}`)

        const today = new Date().toISOString().split('T')[0]
        await evaluateAllCenters(today)

        console.log('[CRON] Alert evaluation completed successfully')

        return NextResponse.json({
            success: true,
            message: 'Alert evaluation completed',
            timestamp: new Date().toISOString(),
            date: today
        })
    } catch (error) {
        console.error('[CRON] Error in alert evaluation:', error)

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
