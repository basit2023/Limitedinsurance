/**
 * Quick Sales Data Generator
 * This script helps you easily add sales data to meet targets
 * 
 * Usage:
 *   npx tsx scripts/add_sales_data.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve)
    })
}

async function addSalesData() {
    console.log('🎯 Sales Data Generator\n')

    const supabase = getSupabaseClient()

    // Get all centers
    const { data: centers, error: centersError } = await supabase
        .from('centers')
        .select('id, center_name, daily_sales_target, region')
        .eq('status', true)
        .order('center_name')

    if (centersError || !centers) {
        console.error('❌ Error fetching centers:', centersError)
        return
    }

    // Display centers
    console.log('📍 Available Centers:\n')
    centers.forEach((center, index) => {
        console.log(`${index + 1}. ${center.center_name} (${center.region}) - Target: ${center.daily_sales_target}/day`)
    })

    console.log('\n')

    // Get user input
    const centerIndexStr = await question('Select center number (or "all" for all centers): ')
    const salesCountStr = await question('How many sales to add? ')
    const dateStr = await question('Date (YYYY-MM-DD) or press Enter for today: ')

    const salesCount = parseInt(salesCountStr)
    const date = dateStr.trim() || new Date().toISOString().split('T')[0]

    if (isNaN(salesCount) || salesCount < 1) {
        console.log('❌ Invalid sales count')
        rl.close()
        return
    }

    let selectedCenters = centers

    if (centerIndexStr.toLowerCase() !== 'all') {
        const centerIndex = parseInt(centerIndexStr) - 1
        if (centerIndex < 0 || centerIndex >= centers.length) {
            console.log('❌ Invalid center number')
            rl.close()
            return
        }
        selectedCenters = [centers[centerIndex]]
    }

    console.log(`\n🚀 Adding ${salesCount} sales for ${selectedCenters.length} center(s) on ${date}...\n`)

    // Add sales data
    for (const center of selectedCenters) {
        console.log(`\n📊 Processing: ${center.center_name}`)

        const salesEntries = []

        for (let i = 1; i <= salesCount; i++) {
            salesEntries.push({
                submission_id: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                date,
                center_id: center.id,
                agent: `Agent ${Math.floor(Math.random() * 100) + 1}`,
                insured_name: `Client ${Math.floor(Math.random() * 1000) + 1}`,
                client_phone_number: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                status: 'Pending Approval',
                call_result: 'Submitted',
                carrier: ['AIG', 'MetLife', 'Prudential', 'Lincoln Financial', 'Transamerica'][Math.floor(Math.random() * 5)],
                product_type: ['Term Life', 'Whole Life', 'Universal Life', 'Variable Life'][Math.floor(Math.random() * 4)],
                monthly_premium: Math.floor(Math.random() * 300) + 50,
                face_amount: [50000, 100000, 250000, 500000, 1000000][Math.floor(Math.random() * 5)],
                created_at: new Date().toISOString()
            })
        }

        const { data, error } = await supabase
            .from('daily_deal_flow')
            .insert(salesEntries)

        if (error) {
            console.log(`   ❌ Error: ${error.message}`)
        } else {
            console.log(`   ✅ Added ${salesCount} sales`)
            
            // Calculate new percentage
            const { count: currentSales } = await supabase
                .from('daily_deal_flow')
                .select('id', { count: 'exact', head: true })
                .eq('center_id', center.id)
                .eq('date', date)
                .eq('status', 'Pending Approval')
                .eq('call_result', 'Submitted')

            const percentage = Math.round(((currentSales || 0) / center.daily_sales_target) * 100)
            console.log(`   📈 Current: ${currentSales}/${center.daily_sales_target} (${percentage}%)`)
        }
    }

    console.log('\n✨ Done!\n')
    rl.close()
}

// Run the script
addSalesData().catch(error => {
    console.error('❌ Fatal error:', error)
    rl.close()
    process.exit(1)
})
