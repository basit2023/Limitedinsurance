-- Helper: Assign existing daily_deal_flow records to centers
-- Run this AFTER running migrate_daily_deal_flow.sql

-- Option 1: Assign all records without center_id to the first available center
UPDATE public.daily_deal_flow 
SET center_id = (SELECT id FROM public.centers WHERE status = true ORDER BY center_name LIMIT 1)
WHERE center_id IS NULL;

-- Option 2: Distribute records evenly across all centers (if you have multiple centers)
-- Uncomment this block if you want to distribute records
/*
WITH numbered_records AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY date, created_at) as row_num
  FROM public.daily_deal_flow
  WHERE center_id IS NULL
),
available_centers AS (
  SELECT 
    id as center_id,
    ROW_NUMBER() OVER (ORDER BY center_name) as center_num
  FROM public.centers
  WHERE status = true
)
UPDATE public.daily_deal_flow ddf
SET center_id = ac.center_id
FROM numbered_records nr
CROSS JOIN LATERAL (
  SELECT center_id 
  FROM available_centers
  WHERE center_num = ((nr.row_num - 1) % (SELECT COUNT(*) FROM available_centers) + 1)
) ac
WHERE ddf.id = nr.id;
*/

-- Option 3: Assign by agent name pattern (customize as needed)
-- Uncomment and modify if your agents are associated with specific centers
/*
-- Example: Assign agents with names starting with 'A-M' to Dallas, 'N-Z' to Phoenix
UPDATE public.daily_deal_flow 
SET center_id = (
  CASE 
    WHEN LEFT(UPPER(agent), 1) BETWEEN 'A' AND 'M' 
      THEN (SELECT id FROM centers WHERE center_name = 'Dallas BPO Center')
    ELSE 
      (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
  END
)
WHERE center_id IS NULL AND agent IS NOT NULL;
*/

-- Verify assignment
SELECT 
  c.center_name,
  COUNT(ddf.id) as total_records,
  COUNT(ddf.id) FILTER (WHERE ddf.status = 'Pending Approval') as pending,
  COUNT(ddf.id) FILTER (WHERE ddf.status = 'Approved') as approved,
  COUNT(ddf.id) FILTER (WHERE ddf.status = 'DQ') as dq,
  MIN(ddf.date) as earliest_date,
  MAX(ddf.date) as latest_date
FROM public.daily_deal_flow ddf
LEFT JOIN public.centers c ON ddf.center_id = c.id
GROUP BY c.center_name
ORDER BY c.center_name;

-- Show any records still without a center
SELECT COUNT(*) as records_without_center
FROM public.daily_deal_flow
WHERE center_id IS NULL;
