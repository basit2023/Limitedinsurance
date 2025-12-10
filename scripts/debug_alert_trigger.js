const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(
    env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAlerts() {
    console.log('--- START DEBUG ---');
    const date = new Date().toISOString().split('T')[0];
    console.log('Date:', date);

    // 1. Get Center
    const { data: centers } = await supabase.from('centers').select('*').limit(1);
    if (!centers || centers.length === 0) { console.log('No centers'); return; }
    const center = centers[0];
    console.log('Center:', center.center_name, center.id);

    // 2. Get Metrics directly
    const { count: totalTransfers } = await supabase
        .from('daily_deal_flow')
        .select('*', { count: 'exact', head: true })
        .eq('date', date)
        .eq('center_id', center.id)
        .or('call_result.eq.Submitted,call_result.eq.Underwriting'); // Approximation of logic

    const { count: sales } = await supabase
        .from('daily_deal_flow')
        .select('*', { count: 'exact', head: true })
        .eq('date', date)
        .eq('center_id', center.id)
        .eq('call_result', 'Submitted');

    console.log(`Metrics => Sales: ${sales}, Transfers (approx): ${totalTransfers}`);

    // 3. Check Rules
    const { data: rules } = await supabase.from('alert_rules').select('*').eq('enabled', true);
    console.log(`Found ${rules.length} active rules`);

    rules.forEach(rule => {
        console.log(`Rule: ${rule.rule_name} (${rule.trigger_type}) < ${rule.condition_threshold}`);
        if (rule.trigger_type === 'low_approval') {
            const ratio = totalTransfers > 0 ? (sales / totalTransfers) * 100 : 0;
            console.log(`   Calc Ratio: ${ratio}% (Threshold: ${rule.condition_threshold}%)`);
            if (ratio < rule.condition_threshold) {
                console.log('   !!! SHOULD ALERT !!!');
            } else {
                console.log('   --- Safe ---');
            }
        }
    });
    console.log('--- END DEBUG ---');
}

debugAlerts();
