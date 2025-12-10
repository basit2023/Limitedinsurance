const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually since we are running standalone
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

const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing credentials in .env.local');
    console.log('Parsed env:', Object.keys(env));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function testInsert() {
    console.log('Testing insert into daily_deal_flow...');

    // First fetch a valid center ID
    const { data: centers, error: centerError } = await supabase
        .from('centers')
        .select('id')
        .limit(1);

    if (centerError) {
        console.error('Error fetching centers:', centerError);
        return;
    }

    if (!centers || centers.length === 0) {
        console.error('No centers found. Cannot insert.');
        return;
    }

    const centerId = centers[0].id;
    console.log('Using Center ID:', centerId);

    const payload = {
        submission_id: `DEBUG-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        center_id: centerId,
        agent: 'Test Agent',
        insured_name: 'Test Insured',
        client_phone_number: '1234567890',
        status: 'Pending Approval',
        call_result: 'Submitted',
        carrier: 'Test Carrier',
        product_type: 'Life Insurance',
        monthly_premium: 100,
        face_amount: 1000,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('daily_deal_flow')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert Success:', data);
    }
}

testInsert();
