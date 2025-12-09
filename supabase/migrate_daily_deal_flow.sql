-- Migration: Update daily_deal_flow table for dashboard compatibility
-- Run this after creating the daily_deal_flow table

-- Step 1: Ensure centers table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'centers') THEN
    RAISE EXCEPTION 'Centers table does not exist. Please run complete_schema.sql or seed_centers.sql first.';
  END IF;
END $$;

-- Step 2: Add center_id column if it doesn't exist
ALTER TABLE public.daily_deal_flow 
ADD COLUMN IF NOT EXISTS center_id uuid;

-- Step 3: Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_deal_flow_center_id_fkey'
  ) THEN
    ALTER TABLE public.daily_deal_flow 
    ADD CONSTRAINT daily_deal_flow_center_id_fkey 
    FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_center_id 
ON public.daily_deal_flow USING btree (center_id);

-- Step 5: Add retention_agent column if missing (used in some reports)
ALTER TABLE public.daily_deal_flow 
ADD COLUMN IF NOT EXISTS retention_agent text;

-- Step 6: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'daily_deal_flow'
  AND column_name IN ('center_id', 'submission_id', 'date', 'status', 'call_result')
ORDER BY column_name;

-- Step 7: Show summary
SELECT 
  'Table updated successfully!' as message,
  COUNT(*) as total_records,
  COUNT(center_id) as records_with_center,
  COUNT(*) - COUNT(center_id) as records_without_center
FROM public.daily_deal_flow;
