#!/usr/bin/env node

/**
 * Quick Alert Testing Script
 * Helps you understand current data and trigger different alert types
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const parts = line.split('=')
        if (parts.length >= 2) {
            const key = parts[0].trim()
            const value = parts.slice(1).join('=').trim().replace(/"/g, '')
            process.env[key] = value
        }
    })
} catch (e) {
    console.warn('Could not read .env.local file')
}

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function showCurrentStatus() {
    console.log('📊 Current Alert System Status\n')
    console.log('='.repeat(80))

    // Show centers and their targets
    console.log('\n🏢 CENTERS & TARGETS:')
    const { data: centers } = await supabase
        .from('centers')
        .select('*')
        .eq('status', true)

    for (const center of centers || []) {
        console.log(`\n  ${center.center_name}`)
        console.log(`  Target: ${center.daily_sales_target} sales/day`)
        console.log(`  Slack Webhook: ${center.slack_webhook_url ? '✅ Configured' : '❌ Not set (uses global)'}`)
    }

    // Show today's sales
    console.log('\n\n📈 TODAY\'S SALES:')
    const today = new Date().toISOString().split('T')[0]

    for (const center of centers || []) {
        const { data: sales } = await supabase
            .from('daily_deal_flow')
            .select('*')
            .eq('center_id', center.id)
            .eq('date', today)
            .in('status', ['Pending Approval'])
            .in('call_result', ['Submitted', 'Underwriting'])

        const submissions = sales?.filter(s => s.call_result === 'Submitted').length || 0
        const transfers = sales?.filter(s => s.call_result === 'Underwriting').length || 0
        const total = submissions + transfers
        const percentage = center.daily_sales_target > 0
            ? Math.round((total / center.daily_sales_target) * 100)
            : 0

        console.log(`\n  ${center.center_name}:`)
        console.log(`    Total Sales: ${total} (${percentage}% of target)`)
        console.log(`    Submissions: ${submissions}`)
        console.log(`    Transfers: ${transfers}`)

        // Predict which alerts might trigger
        const alerts = []
        if (total === 0 && new Date().getHours() >= 12) {
            alerts.push('🚨 ZERO SALES (Critical)')
        }
        if (percentage < 50 && total > 0) {
            alerts.push('⚠️ LOW SALES (Sales Channel)')
        }
        if (submissions > 0 && transfers > 0) {
            const ratio = (transfers / submissions) * 100
            if (ratio < 50) {
                alerts.push('📊 LOW APPROVAL RATIO (Quality Channel)')
            }
        }
        if (percentage >= 75 && percentage < 80) {
            alerts.push('🎉 MILESTONE 75% (Sales Channel)')
        }
        if (percentage >= 100 && percentage < 105) {
            alerts.push('🎉 MILESTONE 100% (Sales Channel)')
        }

        if (alerts.length > 0) {
            console.log(`    Potential Alerts: ${alerts.join(', ')}`)
        } else {
            console.log(`    Potential Alerts: None`)
        }
    }

    // Show alert rules
    console.log('\n\n⚙️ ALERT RULES:')
    const { data: rules } = await supabase
        .from('alert_rules')
        .select('*')
        .order('trigger_type')

    for (const rule of rules || []) {
        const status = rule.enabled && rule.enable_notifications ? '✅' : '❌'
        console.log(`\n  ${status} ${rule.rule_name}`)
        console.log(`     Type: ${rule.trigger_type}`)
        console.log(`     Threshold: ${rule.condition_threshold}`)
        console.log(`     Priority: ${rule.priority}`)
        console.log(`     Channels: ${rule.channels.join(', ')}`)
        console.log(`     Enabled: ${rule.enabled ? 'Yes' : 'No'}`)
        console.log(`     Notifications: ${rule.enable_notifications ? 'On' : 'Off'}`)
    }

    // Show recent alerts
    console.log('\n\n📬 RECENT ALERTS (Last 24 hours):')
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
        .from('alerts_sent')
        .select('*, alert_rules(*), centers(*)')
        .gte('sent_at', yesterday)
        .order('sent_at', { ascending: false })
        .limit(10)

    if (recentAlerts && recentAlerts.length > 0) {
        for (const alert of recentAlerts) {
            const time = new Date(alert.sent_at).toLocaleTimeString()
            console.log(`\n  ${time} - ${alert.centers.center_name}`)
            console.log(`    ${alert.alert_rules.rule_name}`)
            console.log(`    ${alert.message}`)
            console.log(`    Channels: ${alert.channels_sent.join(', ')}`)
        }
    } else {
        console.log('  No alerts sent in the last 24 hours')
    }

    console.log('\n' + '='.repeat(80))
    console.log('\n💡 TIPS:')
    console.log('  1. Add sales data in Supabase to trigger different alerts')
    console.log('  2. Run "npx tsx scripts/run_alerts.ts" to evaluate alerts')
    console.log('  3. Check "supabase/testing_alerts_guide.sql" for SQL examples')
    console.log('  4. Toggle notifications: UPDATE alert_rules SET enable_notifications = false WHERE trigger_type = \'milestone\'')
    console.log('\n')
}

showCurrentStatus().catch(console.error)
