
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv is not installed
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        // Skip empty lines and comments
        if (!line || line.trim().startsWith('#')) return;

        // Match KEY=Value, handling optional quotes
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
    console.log('Env loaded keys:', Object.keys(envConfig)); // Debug log
} catch (e) {
    console.error('⚠️ Could not read .env.local:', e);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAdminEmail() {
    console.log('🔄 Updating latest Admin User to real email...');

    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError || !users || users.length === 0) {
        console.error('❌ Failed to fetch users:', fetchError);
        return;
    }

    const latestUser = users[0];
    const realEmail = 'babaralibj362@gmail.com';

    console.log(`Found latest user: ${latestUser.email} (ID: ${latestUser.id})`);

    const { error: updateError } = await supabase
        .from('users')
        .update({ email: realEmail })
        .eq('id', latestUser.id);

    if (updateError) {
        console.error('❌ Failed to update email:', updateError);
    } else {
        console.log(`✅ Successfully updated user ${latestUser.id} to email: ${realEmail}`);
    }
}

updateAdminEmail();
