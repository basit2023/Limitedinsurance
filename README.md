# Insurance Sales Alert Portal Dashboard

A comprehensive real-time performance monitoring and alert system for insurance BPO centers. Built with Next.js, TypeScript, Supabase, and React.

## 🎯 Overview

The Insurance Sales Alert Portal enables proactive performance management through real-time alerts, automated reporting, and data-driven insights across multiple BPO centers. The system tracks sales volume, quality metrics, approval rates, and triggers intelligent notifications via Slack, email, and push notifications.

## ✨ Key Features

- **Real-Time Dashboard** - Monitor BPO performance with live metrics and visual indicators
- **Multi-Center Monitoring** - Track and compare performance across all centers
- **Automated Alerts** - Smart threshold-based alerts for low sales, zero sales, high DQ rates, etc.
- **Quality Tracking** - Monitor DQ percentages, corrective actions, and compliance
- **Automated Reporting** - Daily, weekly, and monthly performance reports
- **Multi-Channel Notifications** - Slack, Email, and Push notifications
- **Data Entry System** - Easy-to-use interface for submitting sales data
- **Center Rankings** - Performance-based BPO rankings and comparisons
- **User Management** - Role-based access control with permissions
- **Admin Configuration** - Manage centers, alert rules, and notification preferences

## 🏗️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT with bcryptjs
- **Notifications:** Slack Webhooks, Nodemailer, Firebase (Push)
- **Scheduling:** node-cron
- **UI Components:** Lucide React, React Hot Toast
- **Charts:** Custom visualizations with Recharts-ready structure

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- (Optional) Slack workspace for notifications
- (Optional) SMTP server for email notifications

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   - Create a Supabase project at https://app.supabase.com
   - Run `supabase/complete_schema.sql` in SQL Editor
   - Add sample data (see SETUP_GUIDE.md)

3. **Configure environment:**
   ```bash
   copy .env.example .env.local
   ```
   Update `.env.local` with your Supabase credentials and notification settings.

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Access at http://localhost:3000

5. **Run scheduler (optional):**
   ```bash
   npx tsx scheduler.ts
   ```

### Initial Setup

1. **Register a user** at `/register`
2. **Add centers** via SQL or Admin API
3. **Create alert rules** for your thresholds
4. **Enter sales data** at `/dashboard/data-entry`
5. **View dashboard** at `/dashboard`

## 📊 Core Metrics

The system tracks and calculates:

- **Total Sales Volume** - Entries with status "Pending Approval" and call result "Submitted"
- **Underwriting Volume** - Entries with status "Pending Approval" and call result "Underwriting"
- **Transfer Count** - Total entries for the day
- **Approval Rate** - (Pending Approval entries / Total entries) × 100
- **DQ Percentage** - (DQ status entries / Total transfers) × 100
- **Callback Rate** - Percentage of callback requests
- **Approval Ratio** - Transfer vs Submission ratio per center

## 🔔 Alert Types

### Automated Triggers:

1. **Low Sales Volume** - Sales below target threshold
2. **Zero Sales Alert (CRITICAL)** - No sales by specified time
3. **High DQ Rate** - Quality issues exceed acceptable percentage
4. **Low Approval Ratio** - Too many cases going to underwriting
5. **Milestone Achievement** - Positive alerts for reaching targets
6. **Below Threshold Duration** - Consecutive hours below target

### Scheduled Reports:

- **Daily Morning Brief** (8:00 AM) - Yesterday's summary, today's targets
- **Mid-Day Check-in** (1:00 PM) - Progress update, at-risk centers
- **End-of-Day Summary** (5:00 PM) - Final performance, quality summary
- **Weekly Report** (Friday 5:00 PM) - Trends, top/bottom performers
- **Monthly Report** (Last day) - Full analysis, rankings, insights

## 🎨 Dashboard Features

### Main Dashboard (`/dashboard`)
- Real-time KPI cards (Sales, Underwriting, Approval Rate, DQ Rate)
- Center performance table with status indicators
- Search and filter functionality
- Hourly sales charts
- Trend indicators (↑↓ vs. yesterday)
- Color-coded status (Green/Yellow/Red)

### Data Entry (`/dashboard/data-entry`)
- Form to submit daily sales data
- Select center, agent, customer details
- Status and call result dropdowns
- Premium and face amount inputs
- Real-time validation

### User Management (`/dashboard/users`)
- Create/edit users with permissions
- Role-based access control
- Permission level management (can_create, can_edit, can_delete)
- Search and filter users

## 🔧 API Endpoints

### Dashboard APIs
- `GET /api/dashboard/overview?date=YYYY-MM-DD` - Main dashboard data
- `GET /api/dashboard/center/[id]?range=7|14|30` - Center details
- `GET /api/dashboard/rankings?metric=sales|dq|approval|overall` - BPO rankings

### Alert APIs
- `GET /api/alerts?days=7&status=all` - Alert history
- `POST /api/alerts` - Create manual alert
- `PATCH /api/alerts/[id]` - Acknowledge alert

### Quality APIs
- `GET /api/quality/dq-summary?days=7` - DQ tracking
- `GET /api/quality/corrective-actions` - Corrective actions
- `POST /api/quality/corrective-actions` - Create action

### Admin APIs
- `GET /api/admin/centers` - List all centers
- `POST /api/admin/centers` - Create center
- `GET /api/admin/alert-rules` - List alert rules
- `POST /api/admin/alert-rules` - Create rule

### Data Entry API
- `POST /api/data-entry` - Submit sales entry
- `GET /api/data-entry?date=YYYY-MM-DD` - Get entries

## 🔐 Authentication & Permissions

The system uses JWT-based authentication with role-based access control:

- **Permission Levels** - Numeric levels (1-100) for granular control
- **Action Permissions** - can_create, can_edit, can_delete, can_view
- **Protected Routes** - ProtectedRoute component wraps all dashboard pages
- **Session Storage** - Permissions cached in session for performance

Minimum permission level required:
- Dashboard access: Level 15
- User management: Level 20 (recommended)
- Admin functions: Level 50 (recommended)

## 📧 Notification Setup

### Slack
1. Create Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create webhooks for channels
4. Add URLs to `.env.local`

### Email (Gmail)
1. Enable 2FA in Google Account
2. Generate App Password
3. Configure SMTP settings in `.env.local`

### Push Notifications
1. Set up Firebase project
2. Configure FCM for Android, APNs for iOS
3. Add Firebase server key to `.env.local`

## 📈 Metrics Calculation Logic

```typescript
// Sales Volume
status = 'Pending Approval' AND call_result = 'Submitted'

// UW Volume
status = 'Pending Approval' AND call_result = 'Underwriting'

// Approval Rate
(Total Pending Approval / Total Entries) × 100

// DQ Percentage
(DQ Status Count / Total Transfers) × 100

// Target Achievement
(Actual Sales / Daily Target) × 100
```

## 🎯 Color Status Indicators

- **Green** - On target (≥80% achievement)
- **Yellow** - Moderate (50-79% achievement)
- **Red** - Needs attention (<50% achievement)

## 🐛 Troubleshooting

See SETUP_GUIDE.md for detailed troubleshooting:
- Database connection issues
- Alert not triggering
- Notification delivery problems
- Dashboard data not loading

## 📚 Documentation

- **SETUP_GUIDE.md** - Complete setup and usage guide
- **.env.example** - Environment variables reference
- **supabase/complete_schema.sql** - Full database schema

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

### Docker
```bash
docker build -t insurance-portal .
docker run -p 3000:3000 --env-file .env.local insurance-portal
```

### Scheduler Deployment
Deploy `scheduler.ts` to:
- Separate Node.js server
- AWS Lambda with EventBridge
- Vercel Cron Jobs
- Google Cloud Functions

## 🤝 Contributing

This is a custom internal tool. For modifications:
1. Review SETUP_GUIDE.md
2. Test changes locally
3. Update documentation
4. Deploy to staging first

## 📝 License

Proprietary - Internal use only

## 🆘 Support

For questions or issues:
- Review documentation files
- Check API responses for error messages
- Verify database schema matches `complete_schema.sql`
- Ensure environment variables are set correctly

---

**Built with ❤️ for efficient BPO performance management**
