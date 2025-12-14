# Vercel Deployment Troubleshooting Guide

## Issue: Vercel Not Detecting/Deploying After Push

If Vercel isn't automatically deploying after you push to GitHub, follow these steps:

---

## ✅ Step 1: Verify GitHub Repository Connection

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Check if your project exists
3. If it doesn't exist, you need to import it first

---

## 🆕 If Project Doesn't Exist in Vercel

### Import the Project:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Add GitHub Account" or select your GitHub account
3. Search for `Limitedinsurance` repository
4. Click "Import"
5. Configure the project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: Leave blank (uses default `next build`)
   - **Output Directory**: Leave blank (uses default `.next`)

6. **Add Environment Variables** (REQUIRED):

   Click "Environment Variables" and add these:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   JWT_SECRET=your_random_jwt_secret_minimum_32_characters
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   CRON_SECRET=your_random_cron_secret
   ```

7. Click "Deploy"

---

## 🔧 If Project Already Exists But Not Deploying

### Check Auto-Deploy Settings:

1. Go to your project in Vercel
2. Click "Settings" tab
3. Click "Git" in the sidebar
4. Verify these settings:

   **Production Branch**: `main` ✅
   - Make sure this matches your GitHub branch name
   - If your branch is `master`, change this to `master`

   **Deploy Hooks**: Check if any are configured incorrectly

   **Ignored Build Step**: Make sure this is NOT checked or empty

### Re-connect GitHub Integration:

1. Go to Settings > Git
2. Click "Disconnect" (if needed)
3. Click "Connect Git Repository"
4. Select your repository again
5. Authorize Vercel

---

## 🚀 Manual Deployment Options

### Option 1: Redeploy from Vercel Dashboard

1. Go to your project in Vercel
2. Click "Deployments" tab
3. Click the three dots (...) on the latest deployment
4. Click "Redeploy"
5. Check "Use existing Build Cache" (optional)
6. Click "Redeploy"

### Option 2: Trigger Deployment with Empty Commit

```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

### Option 3: Deploy from Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔍 Check Build Logs

1. Go to your project in Vercel
2. Click "Deployments" tab
3. Click on the latest deployment attempt
4. Check the logs for errors

Common errors:
- Missing environment variables
- Build failures
- TypeScript errors
- Missing dependencies

---

## ⚙️ Verify vercel.json Configuration

Your `vercel.json` should be simple:

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

**Important**: Don't add `buildCommand`, `framework`, or other build settings in `vercel.json`. Vercel auto-detects Next.js projects.

---

## 📝 Environment Variables Checklist

Make sure ALL these are set in Vercel:

**Required** (App won't work without these):
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] JWT_SECRET (any random 32+ character string)
- [ ] CRON_SECRET (any random string)

**After First Deployment** (update this):
- [ ] NEXT_PUBLIC_APP_URL (use your actual Vercel URL)

**Optional** (for full features):
- [ ] SLACK_WEBHOOK_SALES_ALERTS
- [ ] SLACK_WEBHOOK_QUALITY_ALERTS
- [ ] SLACK_WEBHOOK_CRITICAL_ALERTS
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASSWORD
- [ ] EMAIL_FROM
- [ ] VAPID_PUBLIC_KEY
- [ ] VAPID_PRIVATE_KEY
- [ ] NEXT_PUBLIC_VAPID_PUBLIC_KEY

---

## 🐛 Common Issues and Solutions

### Issue: "No projects found"
**Solution**: Import your project from GitHub (see above)

### Issue: Build fails with "Module not found"
**Solution**: 
```bash
# Locally, ensure all dependencies are in package.json
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
git push origin main
```

### Issue: Environment variables not working
**Solution**:
1. Make sure variables are added in Vercel dashboard
2. For client-side variables, use `NEXT_PUBLIC_` prefix
3. After adding variables, redeploy

### Issue: "This directory is not a Next.js app"
**Solution**:
1. Verify `package.json` has Next.js in dependencies
2. Verify `next.config.ts` exists
3. Check Root Directory setting in Vercel is `./`

### Issue: Cron jobs not running
**Solution**:
1. Make sure you're on a paid Vercel plan (Hobby plan has cron)
2. Verify `vercel.json` is in the root directory
3. Add `CRON_SECRET` environment variable
4. Check cron logs in Vercel dashboard

---

## 🎯 Quick Fix Steps

Try these in order:

1. **Verify Project Exists**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Look for your project

2. **If No Project**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **If Project Exists**:
   - Check Settings > Git > Production Branch = `main`
   - Trigger manual redeploy
   - Or push empty commit:
     ```bash
     git commit --allow-empty -m "Trigger deployment"
     git push origin main
     ```

4. **Check Deployment Logs**:
   - Vercel Dashboard > Your Project > Deployments
   - Click on latest deployment
   - Review logs for errors

5. **Verify Environment Variables**:
   - Settings > Environment Variables
   - Make sure all required variables are set
   - Especially: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET

---

## 📞 Still Having Issues?

### Check Vercel Status
- Visit [vercel-status.com](https://www.vercel-status.com/)
- Check if there are any ongoing incidents

### Review Vercel Documentation
- [Vercel Deployments](https://vercel.com/docs/deployments/overview)
- [Git Integration](https://vercel.com/docs/deployments/git)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

### Verify Build Locally
```bash
# Test build locally first
npm run build

# If it builds successfully, it should deploy on Vercel
```

---

## ✨ Success Checklist

Once deployed successfully, you should see:

- [ ] Green checkmark in Vercel dashboard
- [ ] Deployment URL is accessible
- [ ] App loads without errors
- [ ] Can register/login
- [ ] Dashboard displays
- [ ] Environment variables are working

---

## 🔗 Useful Links

- **Your GitHub Repo**: https://github.com/basit2023/Limitedinsurance
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Import New Project**: https://vercel.com/new
- **Vercel Docs**: https://vercel.com/docs

---

**Last Updated**: December 15, 2025

If you've followed all these steps and still have issues, the problem might be:
1. GitHub permissions - Vercel needs access to your repository
2. Vercel account issues - Try logging out and back in
3. Repository settings - Check if repository is private (Vercel needs access)

Contact Vercel support if issues persist: https://vercel.com/support
