# Quick Start Guide - Insurance Alert Portal

## 🚀 Get Started in 5 Minutes

This guide will help you get the Insurance Alert Portal running quickly.

## Step 1: Clone and Install (2 minutes)

```bash
# Install dependencies
npm install
```

## Step 2: Configure Environment (2 minutes)

Copy the example environment file:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials (required):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
JWT_SECRET=any_random_32_character_string_here
```

**Note**: Other settings (Slack, Email, Push) are optional for testing.

## Step 3: Setup Database (1 minute)

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy contents of `supabase/complete_schema.sql`
4. Run the SQL

## Step 4: Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 5: Test It Out

1. **Register**: Go to `/register` and create an account
2. **Login**: Login at `/login`
3. **Dashboard**: View the dashboard at `/dashboard`

## 🎯 Next Steps

### Add Sample Data

Run the seed script to add sample centers and rules:

```bash
npx tsx scripts/seed_data.ts
```

### Test Notifications

Test all notification channels:

```bash
npm run test:notifications
```

### Generate VAPID Keys (for PWA Push)

```bash
npm run generate:vapid
```

Add the output to your `.env.local` file.

### Setup Slack Notifications (Optional)

1. Create Slack webhook URLs at [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
2. Add to `.env.local`:
   ```env
   SLACK_WEBHOOK_SALES_ALERTS=https://hooks.slack.com/services/...
   SLACK_WEBHOOK_QUALITY_ALERTS=https://hooks.slack.com/services/...
   SLACK_WEBHOOK_CRITICAL_ALERTS=https://hooks.slack.com/services/...
   ```

### Setup Email Notifications (Optional)

For Gmail:

1. Enable 2-Factor Authentication
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add to `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

## 📊 How It Works

1. **Enter Data**: Sales data is entered via `/dashboard/data-entry`
2. **Alerts Trigger**: System checks sales vs targets every 5 minutes
3. **Notifications Sent**: Alerts sent via Slack, Email, and Push
4. **Dashboard Updates**: Real-time metrics visible on dashboard

## 🔔 Alert Types

The system automatically monitors:

- **Low Sales**: Sales below target threshold (default 70%)
- **Zero Sales**: No sales by noon (CRITICAL)
- **High DQ Rate**: Quality issues above threshold
- **Low Approval**: Too many cases in underwriting
- **Milestones**: Positive alerts at 75%, 100%, 125%, 150% of target

## 🎓 Common Tasks

### Add a New Center

```sql
INSERT INTO centers (center_name, daily_sales_target, location, region, status)
VALUES ('New Center Name', 50, 'City Name', 'Region Name', true);
```

### Add Alert Rule

```sql
INSERT INTO alert_rules (
    rule_name, 
    trigger_type, 
    condition_threshold, 
    alert_message_template,
    recipient_roles,
    channels,
    priority,
    enabled
) VALUES (
    'Low Sales Alert',
    'low_sales',
    70,
    '⚠️ [Center] is at [Percentage]% of target ([SalesCount]/[Target])',
    ARRAY['Admin', 'Manager'],
    ARRAY['slack', 'email', 'push'],
    'high',
    true
);
```

### View Alerts

```bash
npx tsx scripts/check_alerts.js
```

## 🚀 Deploy to Vercel

Ready to deploy? See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete guide.

Quick deploy:

1. Push code to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## 📚 Full Documentation

- [README.md](README.md) - Complete overview
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Deployment guide
- [PWA_SLACK_SETUP.md](PWA_SLACK_SETUP.md) - PWA and Slack setup

## 🆘 Troubleshooting

### Can't connect to database
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify database is running in Supabase dashboard

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

### No notifications sending
- Verify environment variables are set
- Run `npm run test:notifications` to test each channel
- Check that alert rules are enabled in database

## 💡 Tips

- Use `.env.local` for local development (never commit!)
- Set `JWT_SECRET` to any random 32+ character string
- Start with just Supabase config, add others later
- Test with sample data before entering real data
- Check browser console for errors

## 🎉 You're Ready!

Your Insurance Alert Portal is now running. Start by:

1. Adding your centers
2. Creating alert rules
3. Entering sales data
4. Watching alerts flow in!

---

Need help? Check the full documentation or create an issue on GitHub.
