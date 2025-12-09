-- Seed Centers Data
-- Run this in Supabase SQL Editor to add initial BPO centers

-- Insert sample centers
INSERT INTO centers (center_name, location, region, daily_sales_target) VALUES
  ('Dallas BPO Center', 'Dallas, TX', 'South', 50),
  ('Phoenix BPO Center', 'Phoenix, AZ', 'West', 45),
  ('Atlanta BPO Center', 'Atlanta, GA', 'Southeast', 55),
  ('Chicago BPO Center', 'Chicago, IL', 'Midwest', 48),
  ('Miami BPO Center', 'Miami, FL', 'Southeast', 42)
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT * FROM centers ORDER BY center_name;
