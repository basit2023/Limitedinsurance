-- Fix for "schema net does not exist" error
-- Run this SQL in your Supabase SQL Editor

-- Option 1: Enable pg_net extension (RECOMMENDED)
-- This allows the trigger to send HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- After running this, the trigger will work automatically
-- No need to modify any code

----------------------------
-- Option 2: Remove the trigger (if you don't need real-time webhooks)
-- Run this if you prefer to disable the automatic notifications
-- DROP TRIGGER IF EXISTS new_sale_notification ON daily_deal_flow;
-- DROP FUNCTION IF EXISTS notify_new_sale();
