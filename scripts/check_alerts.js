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

async function checkAlerts() {
    console.log('--- CHECKING ALERTS TABLES ---');

    const { data: alerts, error } = await supabase
        .from('alerts_sent')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) { console.error(error); return; }

    console.log('Recent Alerts:', JSON.stringify(alerts, null, 2));
}

checkAlerts();
