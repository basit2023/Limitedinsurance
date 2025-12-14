-- Add slack_webhook_url column to centers table for per-center Slack integration
ALTER TABLE public.centers 
  ADD COLUMN IF NOT EXISTS slack_webhook_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.centers.slack_webhook_url IS 'Slack incoming webhook URL for center-specific notifications';

-- Update existing centers with placeholder (optional - you can set these via UI later)
-- UPDATE public.centers SET slack_webhook_url = NULL WHERE slack_webhook_url IS NULL;
