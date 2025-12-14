# Vercel Deployment Guide

## 🚀 Deploying to Vercel

This guide walks you through deploying the Insurance Sales Alert Portal to Vercel.

## Prerequisites

- GitHub account with your code pushed to a repository
- Vercel account (free tier works)
- Supabase project set up
- Environment variables ready

## Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository and click "Import"

## Step 3: Configure Project Settings

Vercel will auto-detect Next.js. Use these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (leave default)
- **Output Directory**: `.next` (leave default)
- **Install Command**: `npm install` (leave default)

## Step 4: Add Environment Variables

Click "Environment Variables" and add all variables from `.env.example`:

### Required Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
JWT_SECRET=your_random_jwt_secret_minimum_32_characters
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your_random_cron_secret
```

### Optional (but recommended for full functionality):

**For Slack Notifications:**
```
SLACK_WEBHOOK_SALES_ALERTS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_QUALITY_ALERTS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_CRITICAL_ALERTS=https://hooks.slack.com/services/...
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

**For Email Notifications:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
EMAIL_FROM=alerts@yourdomain.com
```

**For PWA Push Notifications:**
```
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (typically 2-3 minutes)
3. Once deployed, click "Visit" to see your app

## Step 6: Configure Vercel Cron Jobs

The `vercel.json` file is already configured with cron jobs:

- `/api/cron/evaluate-alerts` - Runs every 5 minutes
- `/api/cron/hourly-check` - Runs every hour

**Important**: Add `CRON_SECRET` to your environment variables for security.

Vercel will automatically set up these cron jobs based on the `vercel.json` configuration.

## Step 7: Update NEXT_PUBLIC_APP_URL

After deployment, update the `NEXT_PUBLIC_APP_URL` environment variable:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL (e.g., `https://your-app.vercel.app`)
4. Redeploy to apply changes

## Step 8: Test the Deployment

1. Visit your deployed URL
2. Register a new user at `/register`
3. Login at `/login`
4. Access dashboard at `/dashboard`
5. Test notifications at `/api/debug/test-notifications`

## Troubleshooting Common Issues

### Build Fails

**Issue**: Build fails with module not found errors

**Solution**: 
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check build logs in Vercel dashboard

### Environment Variables Not Working

**Issue**: App can't connect to Supabase or other services

**Solution**:
- Verify all environment variables are set correctly
- Make sure `NEXT_PUBLIC_` prefix is used for client-side variables
- Redeploy after adding/changing environment variables

### Cron Jobs Not Running

**Issue**: Alerts not being triggered automatically

**Solution**:
- Verify `vercel.json` is in the root directory
- Check that `CRON_SECRET` is set in environment variables
- View cron job logs in Vercel dashboard under "Deployments" > "Functions"
- Test manually by visiting `/api/cron/evaluate-alerts` with auth header

### Slack Notifications Not Sending

**Issue**: Slack messages not appearing

**Solution**:
- Verify Slack webhook URLs are correct
- Test webhooks using curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL
  ```
- For automatic channel creation, ensure `SLACK_BOT_TOKEN` is set
- Create Slack app with proper permissions (channels:manage, chat:write)

### Email Notifications Not Sending

**Issue**: Emails not being delivered

**Solution**:
- Verify SMTP credentials are correct
- For Gmail, use App Password (not regular password)
- Check spam folder for test emails
- Test SMTP connection locally first

### Push Notifications Not Working

**Issue**: PWA push notifications not received

**Solution**:
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Add both private and public keys to environment variables
- Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set for client-side
- Test push subscription in browser console

## Setting Up Slack for Automatic Channel Creation

To enable automatic Slack channel creation for each center:

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" > "From scratch"
3. Name your app (e.g., "Insurance Alerts")
4. Select your workspace

### 2. Add OAuth Scopes

Under "OAuth & Permissions", add these Bot Token Scopes:

- `channels:manage` - Create and manage channels
- `channels:read` - View channels
- `chat:write` - Send messages
- `users:read` - Look up users by email
- `users:read.email` - View email addresses

### 3. Install App to Workspace

1. Click "Install to Workspace"
2. Authorize the app
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Add Token to Vercel

Add the token to your Vercel environment variables:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
```

### 5. Create Channels for All Centers

After deploying, call the API endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/admin/slack-channels \
  -H "Content-Type: application/json" \
  -d '{"inviteUsers": true}'
```

This will:
- Create a Slack channel for each center
- Invite all users with permission_level > 15 to the channels
- Set channel topics and descriptions

## Generating VAPID Keys for Web Push

Run this command locally:

```bash
npx web-push generate-vapid-keys
```

Add the output to your Vercel environment variables:

```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:admin@yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Monitoring and Logs

View logs in Vercel dashboard:

1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. View "Functions" tab for API logs
5. View "Build" tab for build logs

## Production Checklist

- [ ] All environment variables set
- [ ] Supabase database schema deployed
- [ ] Initial data seeded (users, centers, alert rules)
- [ ] Slack webhooks configured
- [ ] SMTP credentials configured
- [ ] VAPID keys generated and set
- [ ] Cron secret configured
- [ ] Test notifications working
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Custom domain configured (optional)
- [ ] Slack channels created for centers
- [ ] Users registered and assigned permissions

## Continuous Deployment

Every push to your main branch will automatically trigger a new deployment in Vercel.

To deploy from a different branch:

1. Go to Vercel project settings
2. Click "Git"
3. Change "Production Branch" to your desired branch

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
3. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
4. Verify environment variables are set correctly
5. Test API endpoints manually using curl or Postman

## Security Best Practices

- Never commit `.env` files to Git
- Use strong, random values for `JWT_SECRET` and `CRON_SECRET`
- Rotate secrets periodically
- Use Vercel's secret management for sensitive data
- Enable 2FA on Vercel account
- Restrict API access using authentication
- Use HTTPS only (automatic with Vercel)

## Scaling

Vercel automatically scales your application. No configuration needed.

For high-traffic scenarios:
- Consider upgrading to Vercel Pro for better performance
- Use Vercel Edge Functions for critical paths
- Implement caching strategies
- Optimize database queries in Supabase

---

**Your app is now live! 🎉**

Access it at: `https://your-app.vercel.app`
