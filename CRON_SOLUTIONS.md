# Cron Job Solutions for Vercel Free Plan

## ⚠️ Issue
Vercel Free (Hobby) plan only allows cron jobs that run **once per day**.

Your app needed:
- Alert checks every 5 minutes
- Hourly checks

This requires Vercel Pro plan ($20/month).

---

## ✅ Solution Options

### **Option 1: Use Daily Cron (CURRENT SETUP - FREE)**

I've configured the app to run alert checks **once daily at 9 AM**:

```json
{
    "crons": [
        {
            "path": "/api/cron/evaluate-alerts",
            "schedule": "0 9 * * *"
        }
    ]
}
```

**Pros**:
- ✅ Free (works on Hobby plan)
- ✅ Still checks alerts daily

**Cons**:
- ❌ Not real-time (only runs once per day)
- ❌ Won't catch issues throughout the day

**When to use**: If you only need daily summaries and can wait until 9 AM for alerts.

---

### **Option 2: Upgrade to Vercel Pro ($20/month)**

Upgrade your Vercel account to enable frequent cron jobs:

1. Go to https://vercel.com/account/billing
2. Upgrade to Pro plan
3. Restore original `vercel.json`:

```json
{
    "crons": [
        {
            "path": "/api/cron/evaluate-alerts",
            "schedule": "*/5 * * * *"
        },
        {
            "path": "/api/cron/hourly-check",
            "schedule": "0 * * * *"
        }
    ]
}
```

**Pros**:
- ✅ Real-time monitoring (every 5 minutes)
- ✅ Immediate alerts
- ✅ Better for production use

**Cost**: $20/month

---

### **Option 3: Use External Cron Service (FREE Alternative)**

Use a free external service to trigger your API endpoints:

#### A) **cron-job.org** (Free)

1. Go to https://cron-job.org/
2. Create free account
3. Add cron jobs:
   - URL: `https://your-app.vercel.app/api/cron/evaluate-alerts`
   - Schedule: Every 5 minutes
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

#### B) **EasyCron** (Free tier available)

1. Go to https://www.easycron.com/
2. Create free account
3. Set up cron job to call your API

#### C) **GitHub Actions** (FREE)

Create `.github/workflows/cron.yml`:

```yaml
name: Trigger Alerts Check
on:
  schedule:
    # Runs every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  trigger-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Call Alert API
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/evaluate-alerts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub Secrets:
1. Go to your repo > Settings > Secrets and variables > Actions
2. Add new secret: `CRON_SECRET` = your cron secret value

**Pros**:
- ✅ Completely FREE
- ✅ Runs every 5 minutes
- ✅ Reliable

**Cons**:
- Requires GitHub Actions setup
- Slight delay (1-2 minutes sometimes)

---

### **Option 4: Remove Cron Jobs Entirely**

If you don't need automatic checks, remove cron jobs and trigger alerts manually:

**vercel.json**:
```json
{}
```

Then trigger alerts via:
- Manual API calls
- Button in dashboard
- External scheduler

---

## 📊 Comparison

| Option | Cost | Frequency | Setup Difficulty | Reliability |
|--------|------|-----------|------------------|-------------|
| Daily Cron (Current) | FREE | Once/day | ✅ Easy | ✅ High |
| Vercel Pro | $20/mo | Every 5min | ✅ Easy | ✅ Very High |
| External Service | FREE | Every 5min | ⚠️ Medium | ✅ High |
| GitHub Actions | FREE | Every 5min | ⚠️ Medium | ✅ High |
| Manual | FREE | On-demand | ✅ Easy | ⚠️ Low |

---

## 🎯 Recommended Approach

### For Development/Testing:
**Use Daily Cron** (current setup) - It's free and good enough for testing.

### For Production:
**Option A**: If budget allows → **Vercel Pro** ($20/month)
**Option B**: If free is must → **GitHub Actions** (completely free, reliable)

---

## 🚀 Quick Setup: GitHub Actions (FREE)

1. Create folder structure in your repo:
```bash
mkdir -p .github/workflows
```

2. Create file `.github/workflows/cron.yml`:

```yaml
name: Alert Checks
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
    - cron: '0 * * * *'     # Every hour
  workflow_dispatch:

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Evaluate Alerts
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/evaluate-alerts" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Hourly Check
        if: github.event.schedule == '0 * * * *'
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/hourly-check" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

3. Add `CRON_SECRET` to GitHub repository secrets

4. Push to GitHub - Actions will run automatically!

---

## 🔧 Current Status

Your app is configured with **daily cron at 9 AM** (free tier compatible).

To deploy now:

```bash
# Deploy with daily cron (free)
vercel --prod

# Or remove cron entirely if you prefer
# Edit vercel.json and set: {}
```

---

## 💡 My Recommendation

**For now**: Deploy with daily cron (free) to get your app live.

**For production**: Set up GitHub Actions (free) for 5-minute checks.

**If budget allows**: Upgrade to Vercel Pro for best experience.

---

## 🎯 Next Steps

1. **Deploy Now** (with daily cron):
   ```bash
   vercel --prod
   ```

2. **Later, Add GitHub Actions** (for 5-min checks):
   - Create `.github/workflows/cron.yml`
   - Add CRON_SECRET to GitHub secrets
   - Push to GitHub

3. **Alternative**: Upgrade to Vercel Pro if you need integrated solution

---

**Need help setting up GitHub Actions?** Let me know and I'll create the workflow file for you!
