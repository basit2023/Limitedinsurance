
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), '.env.local');
let envVars: any = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, ''); // Remove quotes if any
            envVars[key] = value;
        }
    });
} catch (e) {
    console.warn('Could not read .env.local file, using process.env');
    envVars = process.env;
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables. Please check .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedData() {
    console.log('🌱 Starting data seed...');

    try {
        // 1. Ensure 'Admin Owner' user type exists
        console.log('Checking User Types...');
        let { data: adminType } = await supabase
            .from('user_types')
            .select('id')
            .eq('name', 'Admin Owner')
            .single();

        if (!adminType) {
            console.log("Creating 'Admin Owner' user type...");
            const { data: newType, error: typeError } = await supabase
                .from('user_types')
                .insert({
                    name: 'Admin Owner',
                    permission_level: 100, // Highest level
                    can_create: true,
                    can_edit: true,
                    can_delete: true,
                    can_view: true,
                    description: 'Owner with full access and system notifications'
                })
                .select('id')
                .single();

            if (typeError) throw new Error(`Failed to create user type: ${typeError.message}`);
            adminType = newType;
        }

        // 2. Create 'Admin Owner' User
        const adminEmail = `admin.owner.${Math.floor(Math.random() * 10000)}@example.com`;
        console.log(`Creating Admin User: ${adminEmail}`);
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                full_name: 'System Admin Owner',
                email: adminEmail,
                password_hash: 'hashed_placeholder_pass', // In real app, hash this
                user_type_id: adminType.id,
                status: true
            })
            .select('id')
            .single();

        if (userError) throw new Error(`Failed to create user: ${userError.message}`);

        // 3. Create a Center
        console.log('Creating Test Center...');
        const { data: center, error: centerError } = await supabase
            .from('centers')
            .insert({
                center_name: 'Test Setup Center ' + Math.floor(Math.random() * 100),
                location: 'New York, NY',
                region: 'East',
                daily_sales_target: 10000,
                status: true
            })
            .select('id')
            .single();

        if (centerError) throw new Error(`Failed to create center: ${centerError.message}`);

        // 4. Create Notification Preference
        await supabase.from('notification_preferences').insert({
            user_id: user.id,
            channels_enabled: ['email', 'slack'],
            frequency_cap_minutes: 0 // No cap for testing
        });

        // 5. Create Alert Rule (Low Sales)
        console.log('Creating Alert Rule...');
        const { data: rule, error: ruleError } = await supabase
            .from('alert_rules')
            .insert({
                rule_name: 'Critical Low Sales Alert ' + Math.floor(Math.random() * 100),
                trigger_type: 'low_sales',
                condition_threshold: 50, // Alert if < 50% of target
                alert_message_template: '🚨 ALERT: [Center] is at [Percentage]% of sales target. Remaining: [HoursRemaining] hrs.',
                recipient_roles: ['admin owner'], // Targeting our new role
                channels: ['email', 'slack'],
                priority: 'critical',
                enabled: true
            })
            .select('id')
            .single();

        if (ruleError) throw new Error(`Failed to create alert rule: ${ruleError.message}`);

        // 6. Generate Sales Data (Daily Deal Flow)
        // We'll create very low sales to trigger the "Low Sales" alert
        console.log('Generating Sales Data (Low Performance)...');

        // Create sales logic verified via metricsService
        // Inserting 2 small sales
        const { error: salesError } = await supabase.from('daily_deal_flow').insert([
            {
                submission_id: `SUB-${Date.now()}-1`,
                date: new Date().toISOString().split('T')[0], // Today
                center_id: center.id,
                status: 'Pending Approval',
                call_result: 'Submitted',
                monthly_premium: 500.00,
                agent: 'Test Agent 1',
                client_phone_number: '555-0101'
            },
            {
                submission_id: `SUB-${Date.now()}-2`,
                date: new Date().toISOString().split('T')[0], // Today
                center_id: center.id,
                status: 'Pending Approval',
                call_result: 'Submitted',
                monthly_premium: 500.00,
                agent: 'Test Agent 2',
                client_phone_number: '555-0102'
            }
        ]);

        if (salesError) throw new Error(`Failed to create sales data: ${salesError.message}`);

        console.log('✅ Seed Data Completed Successfully!');
        console.log(`-------------------------------------`);
        console.log(`Admin User: ${adminEmail} (PW: hashed_placeholder_pass)`);

        console.log(`-------------------------------------`);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    }
}

seedData();
