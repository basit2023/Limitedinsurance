-- Database Trigger for New Sale Notifications
-- This trigger automatically sends notifications when new sales are entered

-- Step 1: Create the notification function
CREATE OR REPLACE FUNCTION notify_new_sale()
RETURNS TRIGGER AS $$
DECLARE
  app_url TEXT;
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- Get the application URL from environment or use default
  -- You'll need to update this with your actual Vercel URL
  app_url := 'https://your-app.vercel.app';
  
  -- Build the webhook URL
  webhook_url := app_url || '/api/sales/notify';
  
  -- Build the payload
  payload := jsonb_build_object(
    'centerId', NEW.center_id,
    'salesData', jsonb_build_object(
      'id', NEW.id,
      'date', NEW.date,
      'agent', NEW.agent,
      'insured_name', NEW.insured_name,
      'client_name', NEW.client_name,
      'client_phone_number', NEW.client_phone_number,
      'status', NEW.status,
      'call_result', NEW.call_result,
      'monthly_premium', NEW.monthly_premium,
      'face_amount', NEW.face_amount,
      'carrier', NEW.carrier,
      'created_at', NEW.created_at
    ),
    'type', 'new_entry'
  );
  
  -- Send HTTP POST request to the webhook
  -- Note: This requires the http extension to be enabled in Supabase
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS new_sale_notification ON daily_deal_flow;

CREATE TRIGGER new_sale_notification
  AFTER INSERT ON daily_deal_flow
  FOR EACH ROW
  WHEN (NEW.status = 'Pending Approval' AND NEW.call_result = 'Submitted')
  EXECUTE FUNCTION notify_new_sale();

-- Step 3: Grant necessary permissions
-- Make sure the function can be executed
GRANT EXECUTE ON FUNCTION notify_new_sale() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_sale() TO service_role;

-- Verification query to check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'new_sale_notification';

-- To test the trigger, insert a test sale:
-- INSERT INTO daily_deal_flow (
--   date, center_id, agent, insured_name, status, call_result, monthly_premium
-- ) VALUES (
--   CURRENT_DATE,
--   (SELECT id FROM centers LIMIT 1),
--   'Test Agent',
--   'Test Client',
--   'Pending Approval',
--   'Submitted',
--   150.00
-- );
