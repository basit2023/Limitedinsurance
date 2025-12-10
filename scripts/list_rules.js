const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const supabase = createClient(
    env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function listRules() {
    const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

    if (error) {
        console.error(error);
    } else {
        console.log('Active Rules:', JSON.stringify(rules, null, 2));
    }
}

listRules();
