# PWA Push Notifications & Per-Center Slack Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate VAPID Keys

For **Development**:
```bash
node scripts/generate-vapid-keys.js
```

Copy the output and add to `.env.local`:
```env
VAPID_PUBLIC_KEY=<your_dev_public_key>
VAPID_PRIVATE_KEY=<your_dev_private_key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_dev_public_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

For **Production**:
```bash
node scripts/generate-vapid-keys.js
```

Copy the output and add to `.env.production` (or your production environment):
```env
VAPID_PUBLIC_KEY=<your_prod_public_key>
VAPID_PRIVATE_KEY=<your_prod_private_key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_prod_public_key>
VAPID_SUBJECT=mailto:your-email@example.com
NODE_ENV=production
```

### 3. Run Database Migrations

Execute in Supabase SQL Editor:

```sql
-- Add push subscriptions table
\i supabase/add_push_subscriptions.sql

-- Add slack_webhook_url column to centers
\i supabase/add_center_slack_webhook.sql
```

### 4. Configure Slack Webhooks

#### Option A: Per-Center Webhooks (Recommended)

1. Create a Slack channel for each data center (e.g., `#alerts-center-alpha`)
2. Add incoming webhook integration for each channel
3. Update centers in database:

```sql
UPDATE public.centers 
SET slack_webhook_url = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
WHERE center_name = 'BPO Center Alpha';
```

Or use the Settings UI in the dashboard to configure per-center webhooks.

#### Option B: Global Webhooks (Fallback)

Add to `.env.local`:
```env
SLACK_WEBHOOK_SALES_ALERTS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_WEBHOOK_QUALITY_ALERTS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_WEBHOOK_CRITICAL_ALERTS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Enable Push Notifications

1. Open `http://localhost:3000/dashboard`
2. Look for the "Browser Push Notifications" section
3. Click "Enable Notifications"
4. Grant permission when prompted
5. Click "Send Test" to verify it works

## Testing

### Test PWA Push Notifications

1. Enable notifications in the dashboard
2. Trigger a threshold alert (e.g., low sales)
3. Verify you receive a browser notification
4. Click the notification to ensure it opens the dashboard

### Test Per-Center Slack Channels

1. Configure different Slack webhooks for each center
2. Trigger alerts for different centers
3. Verify each alert goes to the correct Slack channel
4. Check message formatting and metadata

## Production Deployment

1. Generate separate VAPID keys for production
2. Add environment variables to your production environment
3. Run database migrations on production database
4. Configure production Slack webhooks
5. Deploy application
6. Test notifications in production

## Troubleshooting

### Push Notifications Not Working

- Check browser console for errors
- Verify VAPID keys are correctly set in environment
- Ensure service worker is registered (`/sw.js` accessible)
- Check notification permissions in browser settings

### Slack Notifications Not Sending

- Verify webhook URLs are correct
- Check Supabase logs for errors
- Ensure center has `slack_webhook_url` configured or global webhooks are set
- Test webhook URL with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test message"}' \
    YOUR_WEBHOOK_URL
  ```

### Service Worker Issues

- Clear browser cache and reload
- Unregister old service workers in DevTools > Application > Service Workers
- Check `/sw.js` is accessible at root URL
- Verify manifest.json is properly linked in HTML

## Environment Variables Reference

### Required for PWA Push
- `VAPID_PUBLIC_KEY` - Server-side public key
- `VAPID_PRIVATE_KEY` - Server-side private key (keep secret!)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Client-side public key
- `VAPID_SUBJECT` - Email or URL for VAPID

### Optional for Slack
- `SLACK_WEBHOOK_SALES_ALERTS` - Global sales alerts webhook
- `SLACK_WEBHOOK_QUALITY_ALERTS` - Global quality alerts webhook
- `SLACK_WEBHOOK_CRITICAL_ALERTS` - Global critical alerts webhook

### Per-Center Slack
- Configured in database via `centers.slack_webhook_url` column
- Managed through Settings UI or SQL updates
