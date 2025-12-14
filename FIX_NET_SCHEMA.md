# Fix: "schema net does not exist" Error

## 🔴 Problem

When submitting data via `/api/data-entry`, you get:
```
Error: schema "net" does not exist
```

This happens because the database trigger `notify_new_sale()` tries to use `net.http_post()` but the `pg_net` extension isn't enabled in your Supabase database.

---

## ✅ Solution

### **Quick Fix: Enable pg_net Extension**

1. **Go to your Supabase project**: https://app.supabase.com
2. **Navigate to**: SQL Editor
3. **Run this command**:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

4. **Done!** The error will be fixed immediately.

---

## 🎯 What This Does

The `pg_net` extension allows PostgreSQL to make HTTP requests. Your database trigger uses this to:
- Send notifications when new sales are entered
- Trigger real-time alerts
- Call your API webhooks

---

## 🔧 Alternative Solutions

### **Option 1: Enable Extension (RECOMMENDED)**

✅ **Pros**:
- Real-time notifications work
- Triggers function properly
- No code changes needed

❌ **Cons**:
- Requires Supabase extension

**How to**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

---

### **Option 2: Disable the Trigger**

If you don't need automatic webhook notifications:

```sql
DROP TRIGGER IF EXISTS new_sale_notification ON daily_deal_flow;
DROP FUNCTION IF EXISTS notify_new_sale();
```

✅ **Pros**:
- No extension needed
- Simple fix

❌ **Cons**:
- Loses real-time webhook notifications
- Alerts only triggered by cron jobs

---

### **Option 3: Use Supabase Webhooks (Alternative)**

Instead of database triggers, use Supabase native webhooks:

1. Go to: Database > Webhooks
2. Create new webhook
3. Table: `daily_deal_flow`
4. Events: `INSERT`
5. Webhook URL: `https://your-app.vercel.app/api/sales/notify`

✅ **Pros**:
- No extensions needed
- Native Supabase feature

❌ **Cons**:
- Requires manual setup in UI

---

## 🚀 Quick Steps to Fix NOW

**Step 1**: Go to Supabase
- Login at https://app.supabase.com
- Select your project

**Step 2**: Open SQL Editor
- Click "SQL Editor" in left sidebar
- Click "New Query"

**Step 3**: Run this SQL
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

**Step 4**: Test
- Go to your app
- Try submitting data via data-entry page
- Should work now! ✅

---

## 🔍 Verify It's Fixed

After enabling the extension, test:

```bash
# Go to your app
# Navigate to: /dashboard/data-entry
# Submit a test entry
# Should work without errors!
```

Check in browser console or terminal - no more "schema net does not exist" error.

---

## 📋 What the Trigger Does

The `notify_new_sale()` trigger:

1. **Fires** when new row inserted in `daily_deal_flow`
2. **Conditions**: Only when `status = 'Pending Approval'` AND `call_result = 'Submitted'`
3. **Action**: Sends HTTP POST to `/api/sales/notify`
4. **Result**: Real-time alert checks triggered

Without this trigger, alerts only run on cron schedule (once daily on free tier).

---

## 🛠️ If Extension Can't Be Enabled

Some Supabase plans might restrict extensions. If you can't enable `pg_net`:

**Workaround**: Disable the trigger and rely on API-side alerts:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS new_sale_notification ON daily_deal_flow;
DROP FUNCTION IF EXISTS notify_new_sale();
```

Then the app will still work, but:
- No real-time webhook calls
- Alerts only via cron (daily at 9 AM)
- Manual API calls still work

---

## ✅ Recommended Action

**For production**: Enable `pg_net` extension

**Why**: 
- Real-time notifications
- Better user experience
- Immediate alerts

**SQL**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

**That's it!** Your app will work perfectly after this. 🎉

---

## 📞 Need Help?

If you get any errors when enabling the extension:
1. Check your Supabase plan (extensions available on free tier)
2. Verify you have proper permissions
3. Try running as database owner
4. Contact Supabase support if issues persist

---

**File to run**: `supabase/fix_net_schema.sql`

Just copy-paste the SQL into Supabase SQL Editor and run it!
