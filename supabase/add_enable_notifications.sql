-- Add enable_notifications column to alert_rules table
-- This allows each alert rule to be individually enabled/disabled for notifications

ALTER TABLE public.alert_rules 
ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT true;

-- Update existing rules to have notifications enabled by default
UPDATE public.alert_rules 
SET enable_notifications = true 
WHERE enable_notifications IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.alert_rules.enable_notifications IS 'Controls whether notifications are sent for this alert rule. If false, the rule will still be evaluated but no notifications will be sent.';
