# Insurance Sales Alert Portal - Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up and run the Insurance Sales Alert Portal Dashboard system.

## ✅ What's Been Created

### Backend Services
- ✅ **Metrics Service** (`src/services/metricsService.ts`) - Calculates all performance metrics
- ✅ **Alert Engine** (`src/services/alertEngine.ts`) - Evaluates rules and triggers alerts
- ✅ **Notification Dispatcher** (`src/services/notificationDispatcher.ts`) - Sends Slack, Email, Push notifications
- ✅ **Report Service** (`src/services/reportService.ts`) - Generates daily, weekly, monthly reports

### API Endpoints
- ✅ `/api/dashboard/overview` - Main dashboard data
- ✅ `/api/dashboard/center/[id]` - Individual center details
- ✅ `/api/dashboard/rankings` - BPO performance rankings
- ✅ `/api/alerts` - Alert management (GET, POST)
- ✅ `/api/alerts/[id]` - Individual alert operations (PATCH, DELETE)
- ✅ `/api/quality/dq-summary` - DQ tracking and analytics
- ✅ `/api/quality/corrective-actions` - Corrective action management
- ✅ `/api/admin/centers` - Center configuration
- ✅ `/api/admin/alert-rules` - Alert rule management

### Frontend Pages
- ✅ `/dashboard` - Main performance dashboard with real-time data
- ✅ `/dashboard/users` - User management (already created)
- ⏳ `/dashboard/centers/[id]` - Center detail page (to be created)
- ⏳ `/dashboard/alerts` - Alerts management (to be created)
- ⏳ `/dashboard/quality` - Quality dashboard (to be created)

### Database
- ✅ Complete schema in `supabase/complete_schema.sql`
- All tables: centers, alert_rules, alerts_sent, dq_items, corrective_actions, notification_preferences, mobile_devices, daily_deal_flow

## 📦 Installation Steps

### 1. Install Dependencies

All required packages have been installed:
```bash
npm install
```

Packages include:
- node-cron (scheduled tasks)
- @slack/webhook (Slack notifications)
- nodemailer (email sending)
- recharts (data visualization)
- date-fns (date handling)
- react-hot-toast (notifications)
- lucide-react (icons)

### 2. Set Up Database

Run the complete schema SQL file in your Supabase project:

```bash
# Connect to your Supabase database
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/complete_schema.sql
```

Or use the Supabase SQL Editor to run the contents of `supabase/complete_schema.sql`.

### 3. Configure Environment Variables

Copy the example environment file:
```bash
copy .env.example .env.local
```

Update `.env.local` with your actual values:

```env
# Supabase (Required)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# JWT (Required)
JWT_SECRET=your_random_secret_key_here

# Slack (Optional - for alerts)
SLACK_WEBHOOK_SALES_ALERTS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_QUALITY_ALERTS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_CRITICAL_ALERTS=https://hooks.slack.com/services/...

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=alerts@yourdomain.com
```

### 4. Seed Initial Data

You need to add some initial data to test the system:

#### Add Centers:
```sql
INSERT INTO centers (center_name, location, region, daily_sales_target, status) VALUES
('BPO Center Manila', 'Manila, Philippines', 'Asia Pacific', 50, true),
('BPO Center Cebu', 'Cebu, Philippines', 'Asia Pacific', 40, true),
('BPO Center India', 'Bangalore, India', 'Asia', 60, true);
```

#### Add Alert Rules:
```sql
INSERT INTO alert_rules (
  rule_name, trigger_type, condition_threshold, 
  alert_message_template, recipient_roles, channels, priority, enabled
) VALUES
(
  'Low Sales Alert', 
  'low_sales', 
  50, 
  'Center [Center] - Only [SalesCount] sales with [HoursRemaining] hours remaining. Target: [Target]',
  ARRAY['admin', 'manager'],
  ARRAY['slack', 'email'],
  'high',
  true
),
(
  'Zero Sales Critical', 
  'zero_sales', 
  0, 
  '🚨 CRITICAL: [Center] has 0 sales by [Time]. Immediate action required.',
  ARRAY['admin', 'manager'],
  ARRAY['slack', 'email'],
  'critical',
  true
),
(
  'High DQ Rate', 
  'high_dq', 
  15, 
  '[Center] Quality Alert: [DQPercentage]% DQ rate. Top issues: [TopIssues]',
  ARRAY['quality', 'manager'],
  ARRAY['slack'],
  'medium',
  true
);
```

#### Add Sample Daily Deal Flow Data:
```sql
INSERT INTO daily_deal_flow (
  date, center_id, agent, insured_name, status, call_result, monthly_premium
) VALUES
(CURRENT_DATE, (SELECT id FROM centers LIMIT 1), 'Agent001', 'John Doe', 'Pending Approval', 'Submitted', 150),
(CURRENT_DATE, (SELECT id FROM centers LIMIT 1), 'Agent002', 'Jane Smith', 'Pending Approval', 'Submitted', 200),
(CURRENT_DATE, (SELECT id FROM centers LIMIT 1), 'Agent003', 'Bob Johnson', 'Pending Approval', 'Underwriting', 175);
```

## 🏃 Running the System

### Development Mode

Start the Next.js development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Access the Dashboard

1. Register a new user at http://localhost:3000/register
2. Login at http://localhost:3000/login
3. Access the dashboard at http://localhost:3000/dashboard

**Note:** Make sure to create a user with `user_type_id` that has sufficient permissions to view the dashboard.

### Run the Scheduler (for automated alerts and reports)

In a separate terminal:
```bash
npx tsx scheduler.ts
```

This will run:
- Alert evaluation every 5 minutes
- Morning brief at 8:00 AM
- Mid-day check at 1:00 PM
- End-of-day summary at 5:00 PM
- Weekly reports on Fridays at 5:00 PM
- Monthly reports on the last day of each month

## 📊 How to Use the System

### 1. Enter Data

You have several options to enter data:

#### Option A: Direct Database Insert
Insert sales data directly into `daily_deal_flow` table:

```sql
INSERT INTO daily_deal_flow (
  date, center_id, agent, insured_name, 
  client_phone_number, status, call_result, 
  carrier, monthly_premium, face_amount
) VALUES (
  CURRENT_DATE,
  (SELECT id FROM centers WHERE center_name = 'BPO Center Manila'),
  'Agent001',
  'Customer Name',
  '+1234567890',
  'Pending Approval',
  'Submitted',
  'Carrier ABC',
  150.00,
  100000
);
```

#### Option B: Create a Data Entry Form
Create a new page at `src/app/dashboard/data-entry/page.tsx` with a form to submit sales data.

#### Option C: Import CSV
Create an import functionality to bulk upload daily sales data.

### 2. View Dashboard

Navigate to http://localhost:3000/dashboard to see:
- **Real-time KPIs**: Total sales, underwriting volume, approval rates, DQ percentages
- **Center Performance Table**: All centers with their metrics, status, and trends
- **Hourly Charts**: Sales progression throughout the day
- **Status Indicators**: Green (on target), Yellow (moderate), Red (needs attention)

### 3. Monitor Alerts

Alerts will be triggered automatically based on rules:
- **Low Sales**: When center is below target threshold
- **Zero Sales**: Critical alert when no sales by noon
- **High DQ**: When quality issues exceed threshold
- **Low Approval Ratio**: When too many cases go to underwriting

View alerts at `/api/alerts?days=7` or create an alerts page.

### 4. Configure Settings

#### Add New Center:
```bash
curl -X POST http://localhost:3000/api/admin/centers \
  -H "Content-Type: application/json" \
  -d '{
    "centerName": "New BPO Center",
    "location": "City, Country",
    "region": "Region Name",
    "dailySalesTarget": 45
  }'
```

#### Add Custom Alert Rule:
```bash
curl -X POST http://localhost:3000/api/admin/alert-rules \
  -H "Content-Type: application/json" \
  -d '{
    "ruleName": "Custom Alert",
    "triggerType": "low_sales",
    "conditionThreshold": 60,
    "alertMessageTemplate": "Custom message for [Center]",
    "recipientRoles": ["manager"],
    "channels": ["slack"],
    "priority": "medium"
  }'
```

## 🔔 Setting Up Notifications

### Slack Notifications

1. Go to https://api.slack.com/apps
2. Create a new app
3. Enable "Incoming Webhooks"
4. Create webhooks for different channels (#sales-alerts, #quality-alerts, #critical-alerts)
5. Add webhook URLs to `.env.local`

### Email Notifications

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use this app password in `.env.local` as `SMTP_PASSWORD`

## 📈 API Testing

### Test Dashboard API:
```bash
curl http://localhost:3000/api/dashboard/overview?date=2024-12-09
```

### Test Rankings API:
```bash
curl http://localhost:3000/api/dashboard/rankings?date=2024-12-09&metric=overall
```

### Test Alerts API:
```bash
curl http://localhost:3000/api/alerts?days=7&status=all
```

### Manually Trigger an Alert:
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "centerId": "your-center-uuid",
    "message": "Test alert message",
    "channels": ["slack"]
  }'
```

## 🐛 Troubleshooting

### Dashboard shows "No data available"
- Ensure you have centers in the database
- Ensure you have data in `daily_deal_flow` table for today's date
- Check browser console for API errors

### Alerts not triggering
- Verify scheduler is running (`npx tsx scheduler.ts`)
- Check that alert rules are enabled in database
- Verify centers have data for current date

### Slack notifications not sending
- Verify webhook URLs in `.env.local`
- Test webhook manually with curl
- Check scheduler logs for errors

### Email not sending
- Verify SMTP credentials
- For Gmail, use App Password not regular password
- Check firewall/port 587 is open

## 🚀 Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

For the scheduler:
- Use Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Or deploy scheduler to a separate Node.js server

### Environment Setup

Ensure all production environment variables are set:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET (use a strong random key)
- Slack webhooks
- SMTP credentials

## 📚 Next Steps

1. **Create Center Detail Page**: Build `/dashboard/centers/[id]` to show individual center performance with charts
2. **Create Alerts Page**: Build `/dashboard/alerts` to manage and acknowledge alerts
3. **Create Quality Dashboard**: Build `/dashboard/quality` to track DQ items and corrective actions
4. **Add Data Entry Form**: Create a form for agents to enter sales data
5. **Set Up Real-time Updates**: Implement Server-Sent Events for live dashboard updates
6. **Mobile App**: Build iOS/Android app for push notifications
7. **Advanced Analytics**: Add trend analysis, forecasting, and AI insights

## 🆘 Support

For issues or questions:
- Check the IMPLEMENTATION_GUIDE.md for detailed technical documentation
- Review API endpoints in the `src/app/api` directory
- Check service implementations in `src/services`

## 🎯 Key Features Implemented

✅ Real-time dashboard with performance metrics  
✅ Multi-center monitoring  
✅ Automated alert system with configurable rules  
✅ Quality tracking (DQ percentage, corrective actions)  
✅ Notification dispatcher (Slack, Email ready)  
✅ Automated reporting (daily, weekly, monthly)  
✅ Center rankings and comparisons  
✅ Hourly performance tracking  
✅ Trend analysis  
✅ User management with permissions  
✅ Admin configuration APIs  

---

**You're now ready to use the Insurance Sales Alert Portal! Start by entering some data and watching the dashboard come to life.** 🎉
