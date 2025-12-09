-- Seed Sample Sales Data
-- Run this AFTER adding centers to populate the dashboard with sample data

-- First, get a center_id (replace with actual ID from your centers table)
-- Run: SELECT id, center_name FROM centers;
-- Then use one of the IDs below

-- Example: Insert sample data for today
-- Replace 'YOUR_CENTER_ID_HERE' with an actual center UUID

INSERT INTO daily_deal_flow (
  date,
  center_id,
  agent,
  insured_name,
  client_phone_number,
  status,
  call_result,
  carrier,
  product_type,
  monthly_premium,
  face_amount
)
SELECT
  CURRENT_DATE,
  c.id,
  'Agent ' || (random() * 10)::int,
  'Customer ' || (random() * 100)::int,
  '555-' || lpad((random() * 9999)::int::text, 4, '0'),
  CASE 
    WHEN random() < 0.7 THEN 'Pending Approval'
    WHEN random() < 0.9 THEN 'Approved'
    ELSE 'DQ'
  END,
  CASE 
    WHEN random() < 0.6 THEN 'Submitted'
    WHEN random() < 0.8 THEN 'Underwriting'
    WHEN random() < 0.9 THEN 'Callback'
    ELSE 'No Sale'
  END,
  (ARRAY['Liberty Bankers', 'Royal Neighbors', 'Foresters', 'Prosperity Life'])[ceil(random() * 4)],
  'Life Insurance',
  (random() * 150 + 50)::numeric(10,2),
  (random() * 450000 + 50000)::numeric(10,2)
FROM centers c, generate_series(1, 30) -- 30 entries per center for today
WHERE c.status = true;

-- Verify the data
SELECT 
  c.center_name,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE status = 'Pending Approval' AND call_result = 'Submitted') as sales,
  COUNT(*) FILTER (WHERE status = 'DQ') as dq_count
FROM daily_deal_flow d
JOIN centers c ON d.center_id = c.id
WHERE d.date = CURRENT_DATE
GROUP BY c.center_name
ORDER BY c.center_name;
