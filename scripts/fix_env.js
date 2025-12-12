
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const webhookUrl = process.env.SLACK_WEBHOOK_SALES_ALERTS || 'YOUR_WEBHOOK_URL_HERE';

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];

    // Regex to identify Slack lines (both placeholder and real)
    const slackKeyRegex = /^SLACK_WEBHOOK_(SALES|QUALITY|CRITICAL)_ALERTS=/;

    // Filter out ANY existing Slack lines to avoid duplicates
    lines.forEach(line => {
        if (!slackKeyRegex.test(line)) {
            newLines.push(line);
        }
    });

    // Append the correct lines
    newLines.push(`SLACK_WEBHOOK_SALES_ALERTS=${webhookUrl}`);
    newLines.push(`SLACK_WEBHOOK_QUALITY_ALERTS=${webhookUrl}`);
    newLines.push(`SLACK_WEBHOOK_CRITICAL_ALERTS=${webhookUrl}`);

    // Join and verify no double newlines issues if irrelevant
    let finalContent = newLines.join('\n');

    fs.writeFileSync(envPath, finalContent, 'utf8');
    console.log('✅ .env.local fixed successfully');
} catch (e) {
    console.error('❌ Error fixing .env.local:', e);
}
