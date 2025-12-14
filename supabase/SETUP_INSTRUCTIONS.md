# Database Trigger Setup Instructions

## Where to Execute the SQL

1. **Go to Supabase Dashboard**
   - Open your browser
   - Navigate to: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on your insurance project

3. **Open SQL Editor**
   - In the left sidebar, click on **SQL Editor** (icon looks like `</>`)
   - OR go directly to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

4. **Create New Query**
   - Click **New query** button (top right)
   - This opens a blank SQL editor

5. **Paste the SQL**
   - Open the file: `supabase/new_sale_trigger.sql`
   - Copy ALL the contents
   - Paste into the Supabase SQL Editor

6. **Run the SQL**
   - Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - You should see: "Success. No rows returned"

7. **Verify Trigger is Created**
   - The last query in the file will show the trigger details
   - You should see one row with:
     - `trigger_name`: new_sale_notification
     - `event_object_table`: daily_deal_flow

## What This Does

The trigger will automatically:
- Fire when a new row is inserted into `daily_deal_flow` table
- Check if `status = 'Pending Approval'` AND `call_result = 'Submitted'`
- Send an HTTP POST request to: `https://limitedinsurance-f1v9.vercel.app/api/sales/notify`
- Your API endpoint will then send notifications via Slack, Email, and Push

## Testing the Trigger

After running the SQL, test it by inserting a new sale:

### Option 1: Via Supabase Table Editor
1. Go to **Table Editor** → `daily_deal_flow`
2. Click **Insert row**
3. Fill in:
   - `date`: 2025-12-14 (today)
   - `center_id`: (select from dropdown)
   - `agent`: "Test Agent"
   - `insured_name`: "Test Client"
   - `status`: "Pending Approval"
   - `call_result`: "Submitted"
   - `monthly_premium`: 150.00
4. Click **Save**
5. Check your Slack/Email for notification!

### Option 2: Via SQL
Run this in SQL Editor:
```sql
INSERT INTO daily_deal_flow (
  date, center_id, agent, insured_name, status, call_result, monthly_premium
) VALUES (
  CURRENT_DATE,
  (SELECT id FROM centers LIMIT 1),
  'Test Agent',
  'Test Client',
  'Pending Approval',
  'Submitted',
  150.00
);
```

## Troubleshooting

### Error: "extension pg_net does not exist"

If you get this error, you need to enable the `pg_net` extension:

1. In Supabase SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. Then re-run the trigger SQL

### Error: "permission denied"

Make sure you're using the SQL Editor in Supabase Dashboard (not a client connection). The SQL Editor has admin privileges.

### Trigger not firing?

1. Check Supabase logs:
   - Dashboard → Logs → Database
   - Look for errors

2. Verify trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'new_sale_notification';
   ```

3. Check your Vercel deployment logs:
   - Vercel Dashboard → Your Project → Logs
   - Filter by `/api/sales/notify`
   - See if requests are coming through

## Next Steps

After setting up the trigger:

1. ✅ Push your code to Git (already done!)
2. ✅ Vercel will auto-deploy
3. ✅ Run the trigger SQL in Supabase
4. ✅ Test by inserting a new sale
5. ✅ Verify notifications are received

**Your real-time notification system is ready!** 🎉
