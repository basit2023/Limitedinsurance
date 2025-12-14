/**
 * Bulk Sales Data Generator
 * Quickly add sales to meet targets for all centers
 * 
 * Usage:
 *   npx tsx scripts/bulk_add_sales.ts
 */

import 'dotenv/config'
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

async function bulkAddSales() {
    console.log('🚀 Bulk Sales Generator - Meet Targets for All Centers\n')

    const supabase = getSupabaseClient()
    const date = new Date().toISOString().split('T')[0]

    // Get all centers
    const { data: centers, error: centersError } = await supabase
        .from('centers')
        .select('id, center_name, daily_sales_target, region')
        .eq('status', true)

    if (centersError || !centers) {
        console.error('❌ Error fetching centers:', centersError)
        return
    }

    console.log(`📅 Date: ${date}`)
    console.log(`📍 Processing ${centers.length} centers\n`)

    for (const center of centers) {
        console.log(`\n🏢 ${center.center_name} (${center.region})`)
        console.log(`   Target: ${center.daily_sales_target} sales/day`)

        // Get current sales
        const { count: currentSales } = await supabase
            .from('daily_deal_flow')
            .select('id', { count: 'exact', head: true })
            .eq('center_id', center.id)
            .eq('date', date)
            .eq('status', 'Pending Approval')
            .eq('call_result', 'Submitted')

        const current = currentSales || 0
        console.log(`   Current: ${current} sales`)

        // Calculate how many sales needed to reach 80% of target
        const targetSales = Math.ceil(center.daily_sales_target * 0.8)
        const salesNeeded = Math.max(0, targetSales - current)

        if (salesNeeded === 0) {
            console.log(`   ✅ Already at target! (${Math.round((current / center.daily_sales_target) * 100)}%)`)
            continue
        }

        console.log(`   🎯 Adding ${salesNeeded} sales to reach 80% target...`)

        // Generate sales entries
        const salesEntries = []

        for (let i = 1; i <= salesNeeded; i++) {
            salesEntries.push({
                submission_id: `SUB-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                date,
                center_id: center.id,
                agent: `Agent ${Math.floor(Math.random() * 50) + 1}`,
                insured_name: `Client ${Math.floor(Math.random() * 1000) + 1}`,
                client_phone_number: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                status: 'Pending Approval',
                call_result: 'Submitted',
                carrier: ['AIG', 'MetLife', 'Prudential', 'Lincoln Financial', 'Transamerica', 'John Hancock'][Math.floor(Math.random() * 6)],
                product_type: ['Term Life', 'Whole Life', 'Universal Life', 'Variable Life', 'Final Expense'][Math.floor(Math.random() * 5)],
                monthly_premium: Math.floor(Math.random() * 400) + 50,
                face_amount: [50000, 100000, 150000, 250000, 500000, 1000000][Math.floor(Math.random() * 6)],
                created_at: new Date().toISOString()
            })
        }

        // Insert in batches of 100
        const batchSize = 100
        for (let i = 0; i < salesEntries.length; i += batchSize) {
            const batch = salesEntries.slice(i, i + batchSize)
            const { error } = await supabase
                .from('daily_deal_flow')
                .insert(batch)

            if (error) {
                console.log(`   ❌ Error in batch: ${error.message}`)
                break
            }
        }

        const newTotal = current + salesNeeded
        const newPercentage = Math.round((newTotal / center.daily_sales_target) * 100)

        console.log(`   ✅ Success! New total: ${newTotal}/${center.daily_sales_target} (${newPercentage}%)`)
    }

    console.log('\n\n🎉 All centers updated!\n')
    console.log('💡 Tip: Run the alert check to see updated status:')
    console.log('   curl https://your-app.vercel.app/api/cron/evaluate-alerts\n')
}

// Run the script
bulkAddSales().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
})
