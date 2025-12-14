-- Fix Alert Rules to Include Push Notifications
-- Run this in Supabase SQL Editor

-- Update all alert rules to include push notifications
UPDATE alert_rules
SET channels = ARRAY['email', 'slack', 'push']
WHERE 'push' = ANY(channels) IS FALSE;

-- Verify the update
SELECT 
  rule_name, 
  channels,
  enabled,
  trigger_type
FROM alert_rules
ORDER BY rule_name;

-- Sample output should show:
-- channels: {email, slack, push}
