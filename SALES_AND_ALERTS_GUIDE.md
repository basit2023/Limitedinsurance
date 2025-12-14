# Understanding Your Insurance Alert System

## 🚨 Issues You're Experiencing

### 1. ❌ Slack Channels Not Being Created
**Message**: `SLACK_BOT_TOKEN not configured`

**Why**: The system needs a Slack Bot Token to automatically create channels for each center.

**Fix**: Add `SLACK_BOT_TOKEN` to your environment variables (see setup below)

---

### 2. ❌ Push Notifications Not Sending
**Why**: The alert rules don't have `push` in the channels array.

**Current channels**: `['email', 'slack']`
**Should be**: `['email', 'slack', 'push']`

**Fix**: Update your alert rules to include push notifications.

---

## 📊 How Sales Work

### **What Counts as a Sale?**

A sale is counted when an entry in `daily_deal_flow` has:
- ✅ `status` = `'Pending Approval'`
- ✅ `call_result` = `'Submitted'`

**Code reference**:
```typescript
// This is how sales are calculated
SELECT COUNT(*) 
FROM daily_deal_flow 
WHERE date = '2025-12-15'
  AND status = 'Pending Approval'
  AND call_result = 'Submitted'
  AND center_id = 'your-center-id'
```

---

## 📈 How to Increase Sales

### **Option 1: Enter Sales via Dashboard (EASIEST)**

1. Go to: **`/dashboard/data-entry`**
2. Fill in the form:
   - **Date**: Today's date
   - **Center**: Test Setup Center 6
   - **Agent**: Agent name
   - **Insured Name**: Client name
   - **Phone**: Client phone
   - **Status**: Select **"Pending Approval"** ✅
   - **Call Result**: Select **"Submitted"** ✅
   - **Carrier**: Insurance company
   - **Product Type**: Type of policy
   - **Monthly Premium**: Amount
   - **Face Amount**: Coverage amount

3. Click **"Submit"**

4. **Each entry counts as 1 sale** when:
   - Status = "Pending Approval"
   - Call Result = "Submitted"

---

### **Option 2: Insert via SQL**

Run this in Supabase SQL Editor:

```sql
-- Insert a test sale for today
INSERT INTO daily_deal_flow (
  submission_id,
  date,
  center_id,
  agent,
  insured_name,
  client_phone_number,
  status,
  call_result,
  carrier,
  product_type,
  monthly_premium,
  face_amount,
  created_at
) VALUES (
  'SUB-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  CURRENT_DATE,  -- Today's date
  'your-center-id-here',  -- Your center ID
  'John Doe',
  'Test Client',
  '555-1234',
  'Pending Approval',  -- This is required for sales count
  'Submitted',         -- This is required for sales count
  'Test Carrier',
  'Term Life',
  100.00,
  50000.00,
  NOW()
);
```

**Repeat this 5-10 times to create multiple sales**

---

### **Option 3: Bulk Import via API**

Use this script to create multiple sales:

```bash
# Create 10 sales entries
for i in {1..10}; do
  curl -X POST https://your-app.vercel.app/api/data-entry \
    -H "Content-Type: application/json" \
    -d '{
      "date": "2025-12-15",
      "centerId": "your-center-id",
      "agent": "Agent '$i'",
      "insuredName": "Client '$i'",
      "clientPhoneNumber": "555-000'$i'",
      "status": "Pending Approval",
      "callResult": "Submitted",
      "carrier": "Test Carrier",
      "productType": "Term Life",
      "monthlyPremium": 100,
      "faceAmount": 50000
    }'
done
```

---

## 🎯 Understanding the Alert

### **Your Alert Message**:
> 🚨 ALERT: Test Setup Center 6 is at 0% of sales target. Remaining: 24 hrs.

**What This Means**:

- **0% of sales target** = You have 0 sales entered for today
- **Sales Target** = Set in the `centers` table (e.g., 50 sales/day)
- **Remaining: 24 hrs** = Time left in the day to meet target

### **How Alert is Calculated**:

```javascript
// Example:
Center daily target: 50 sales
Current sales: 0
Percentage: (0 / 50) * 100 = 0%

// Alert triggers when percentage < 70% (default threshold)
```

---

## 🔧 Fixing All Issues

### **1. Enable Push Notifications**

Update your alert rules to include push channel:

```sql
-- Update alert rule to include push notifications
UPDATE alert_rules
SET channels = ARRAY['email', 'slack', 'push']
WHERE rule_name = 'Critical Low Sales Alert';
```

---

### **2. Add Slack Bot Token (Optional - for auto-channel creation)**

**Step 1**: Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name: "Insurance Alerts"
5. Select your workspace

**Step 2**: Add Permissions
- Go to "OAuth & Permissions"
- Add these scopes:
  - `channels:manage`
  - `channels:read`
  - `chat:write`
  - `users:read`
  - `users:read.email`

**Step 3**: Install App
- Click "Install to Workspace"
- Copy the "Bot User OAuth Token" (starts with `xoxb-`)

**Step 4**: Add to Environment Variables
- In Vercel: Settings > Environment Variables
- Add: `SLACK_BOT_TOKEN=xoxb-your-token-here`
- Redeploy

---

### **3. Configure VAPID Keys for Push Notifications**

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Add to Vercel environment variables:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
```

---

## 📝 Quick Test Scenario

### **Test: Enter 5 Sales and See Alerts Clear**

1. **Check Current Status**:
   - Go to `/dashboard`
   - See "0% of target"

2. **Enter 5 Sales**:
   - Go to `/dashboard/data-entry`
   - Submit 5 entries with:
     - Status: "Pending Approval"
     - Call Result: "Submitted"

3. **Wait or Trigger Check**:
   - Wait for cron (9 AM daily)
   - Or call: `/api/cron/evaluate-alerts`

4. **Check Results**:
   - If target is 50: You'll now be at 10%
   - If target is 10: You'll be at 50%
   - Alert should show new percentage

---

## 🎲 Sample Data Entry

Here's what a valid sale entry looks like:

| Field | Value | Required for Sale Count |
|-------|-------|------------------------|
| Date | 2025-12-15 | ✅ Must be today |
| Center | Test Setup Center 6 | ✅ |
| Agent | John Smith | No |
| Insured Name | Jane Doe | No |
| Phone | 555-1234 | No |
| **Status** | **Pending Approval** | ✅ **YES - Required** |
| **Call Result** | **Submitted** | ✅ **YES - Required** |
| Carrier | ACME Insurance | No |
| Product Type | Term Life | No |
| Monthly Premium | $100 | No |
| Face Amount | $50,000 | No |

**Only the bold fields affect sales count!**

---

## 🔍 Check Your Center's Target

Find out what your daily sales target is:

```sql
-- Check center target
SELECT center_name, daily_sales_target
FROM centers
WHERE center_name = 'Test Setup Center 6';
```

Example:
- If `daily_sales_target` = 50
- You need 50 entries with Status="Pending Approval" and CallResult="Submitted"
- To reach 100%, you need all 50
- To reach 70% (avoid alert), you need 35

---

## ✅ Summary

**To increase sales and stop alerts**:

1. ✅ Go to `/dashboard/data-entry`
2. ✅ Enter sales with Status="Pending Approval" and CallResult="Submitted"
3. ✅ Enter enough sales to meet 70% of your daily target
4. ✅ Wait for next cron check (9 AM) or trigger manually

**To fix push notifications**:

1. ✅ Update alert rule: `channels = ['email', 'slack', 'push']`
2. ✅ Add VAPID keys to environment variables
3. ✅ Redeploy app

**To fix Slack channel creation**:

1. ✅ Create Slack app
2. ✅ Add SLACK_BOT_TOKEN to environment variables
3. ✅ Redeploy app

---

**Questions?** Let me know which part you need help with!
