const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const supabase = createClient(
    env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedRules() {
    const rules = [
        {
            rule_name: 'Low Approval Rate Warning',
            trigger_type: 'low_approval',
            condition_threshold: 75,
            alert_message_template: '⚠️ Alert: Approval Rate for [Center] dropped to [ApprovalRatio]%! ([SubmissionCount] Subs / [UWCount] Transfers)',
            recipient_roles: ['admin', 'manager'],
            channels: ['slack', 'email'],
            priority: 'high',
            enabled: true
        },
        {
            rule_name: 'Zero Sales Alert',
            trigger_type: 'zero_sales',
            condition_threshold: 0,
            alert_message_template: '🚨 CRITICAL: [Center] has ZERO sales as of [Time]:00!',
            recipient_roles: ['admin', 'manager'],
            channels: ['slack', 'email', 'push'],
            priority: 'critical',
            enabled: true
        }
    ];

    const { data, error } = await supabase
        .from('alert_rules')
        .insert(rules)
        .select();

    if (error) console.error('Error seeding rules:', error);
    else console.log('Seeded rules:', data);
}

seedRules();
