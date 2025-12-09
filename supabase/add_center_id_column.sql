-- Add center_id column to daily_deal_flow table
-- This is required for the dashboard to work properly

-- Add the center_id column
ALTER TABLE public.daily_deal_flow 
ADD COLUMN IF NOT EXISTS center_id uuid;

-- Add foreign key constraint to centers table
ALTER TABLE public.daily_deal_flow 
ADD CONSTRAINT daily_deal_flow_center_id_fkey 
FOREIGN KEY (center_id) REFERENCES public.centers(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_center_id 
ON public.daily_deal_flow USING btree (center_id);

-- Optional: Update existing records to assign them to a default center
-- Uncomment and modify the center_id if you want to assign existing records
-- UPDATE public.daily_deal_flow 
-- SET center_id = 'YOUR_DEFAULT_CENTER_ID_HERE'
-- WHERE center_id IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_deal_flow' 
AND column_name = 'center_id';
