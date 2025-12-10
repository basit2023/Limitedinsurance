const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
// Since I can't easily import TS in this JS script without setup, I will just debug the data state first.

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

async function debugExtended() {
    console.log('--- EXTENDED DEBUG ---');
    const date = new Date().toISOString().split('T')[0];
    console.log('Date:', date);

    // 1. Get raw entries for today
    const { data: entries, error } = await supabase
        .from('daily_deal_flow')
        .select('center_id, status, call_result, created_at')
        .eq('date', date);

    if (error) { console.error(error); return; }

    console.log(`Found ${entries.length} total entries for today.`);

    // Group by center
    const centers = {};
    entries.forEach(e => {
        if (!centers[e.center_id]) centers[e.center_id] = [];
        centers[e.center_id].push(e);
    });

    for (const centerId of Object.keys(centers)) {
        const rows = centers[centerId];
        console.log(`\nCenter: ${centerId}`);
        console.log('Rows:', JSON.stringify(rows, null, 2));

        const sales = rows.filter(r => r.status === 'Pending Approval' && r.call_result === 'Submitted').length;
        const transfers = rows.length;
        const ratio = transfers > 0 ? (sales / transfers) * 100 : 0;

        console.log(`   Sales: ${sales}`);
        console.log(`   Transfers: ${transfers}`);
        console.log(`   Ratio: ${ratio}%`);

        // Check rules again
        const { data: rules } = await supabase.from('alert_rules').select('*').eq('enabled', true);

        for (const rule of rules) {
            if (rule.trigger_type === 'low_approval') {
                console.log(`   Checking Rule ${rule.rule_name} (< ${rule.condition_threshold}%)`);
                if (ratio < rule.condition_threshold) {
                    console.log('      [VIOLATION DETECTED]');
                } else {
                    console.log('      [OK]');
                }
            }
        }
    }
}

debugExtended();
