
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAdminEmail() {
    console.log('🔄 Updating latest Admin User to real email...');

    // 1. Get the most recent Admin Owner user
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

    // 2. Update the email
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
