-- Script to update existing centers with placeholder Slack webhook URLs
-- Run this after adding the slack_webhook_url column to the centers table

-- Option 1: Set all centers to use the global webhook (NULL = use global)
-- This is the default behavior, no action needed

-- Option 2: Set specific Slack webhooks for each center
-- Replace the URLs below with your actual Slack incoming webhook URLs

-- Example: Update specific centers with their own webhooks
/*
UPDATE public.centers 
SET slack_webhook_url = 'https://hooks.slack.com/services/YOUR/ALPHA/WEBHOOK'
WHERE center_name = 'BPO Center Alpha';

UPDATE public.centers 
SET slack_webhook_url = 'https://hooks.slack.com/services/YOUR/BETA/WEBHOOK'
WHERE center_name = 'BPO Center Beta';

UPDATE public.centers 
SET slack_webhook_url = 'https://hooks.slack.com/services/YOUR/GAMMA/WEBHOOK'
WHERE center_name = 'BPO Center Gamma';

UPDATE public.centers 
SET slack_webhook_url = 'https://hooks.slack.com/services/YOUR/DELTA/WEBHOOK'
WHERE center_name = 'BPO Center Delta';
*/

-- Verify the updates
SELECT id, center_name, slack_webhook_url 
FROM public.centers 
ORDER BY center_name;

-- Note: You can also configure these via the Settings UI in the dashboard
