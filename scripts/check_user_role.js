
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (!line || line.trim().startsWith('#')) return;
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            envConfig[match[1]] = value;
        }
    });
} catch (e) { }

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
    const email = 'babaralibj362@gmail.com';
    console.log(`Checking user: ${email}...`);

    const { data, error } = await supabase
        .from('users')
        .select('*, user_types(name)')
        .eq('email', email)
        .single();

    if (error) {
        console.error('❌ Error fetching user:', error);
    } else {
        console.log('✅ User Found:', data);
        if (!data.user_types || data.user_types.name !== 'Admin Owner') {
            console.log('⚠️ WARNING: User is NOT an Admin Owner. Fixing...');
            // Fix it
            const { data: typeData } = await supabase.from('user_types').select('id').eq('name', 'Admin Owner').single();
            if (typeData) {
                await supabase.from('users').update({ user_type_id: typeData.id }).eq('id', data.id);
                console.log('✅ User role updated to Admin Owner');
            }
        } else {
            console.log('✅ User IS an Admin Owner.');
        }
    }
}

checkUser();
