-- Testing Guide: How to Trigger Different Alert Types
-- Run these queries in Supabase SQL Editor to test various alert scenarios

-- ============================================
-- 1. ZERO SALES ALERT (Goes to CRITICAL channel)
-- ============================================
-- Ensure there are NO sales records for today for a specific center
-- This will trigger if it's past noon (12 PM)

DELETE FROM daily_deal_flow 
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND date = CURRENT_DATE;

-- Then run: npx tsx scripts/run_alerts.ts
-- Expected: Zero sales alert to CRITICAL Slack channel


-- ============================================
-- 2. LOW SALES ALERT (Goes to SALES channel)
-- ============================================
-- Add some sales but below the target threshold
-- First, check the center's daily target:

SELECT center_name, daily_sales_target FROM centers WHERE center_name = 'Phoenix BPO Center';

-- Add 1-2 sales (assuming target is higher, like 10+)
INSERT INTO daily_deal_flow (
    submission_id, 
    center_id, 
    date, 
    status, 
    call_result,
    insured_name,
    agent
) VALUES 
(
    'TEST-SALE-001',
    (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
    CURRENT_DATE,
    'Pending Approval',
    'Submitted',
    'Test Customer 1',
    'Test Agent'
),
(
    'TEST-SALE-002',
    (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
    CURRENT_DATE,
    'Pending Approval',
    'Underwriting',
    'Test Customer 2',
    'Test Agent'
);

-- Then run: npx tsx scripts/run_alerts.ts
-- Expected: Low sales alert to SALES Slack channel


-- ============================================
-- 3. HIGH DQ (Data Quality) ALERT (Goes to QUALITY channel)
-- ============================================
-- Add DQ items to trigger high DQ percentage alert

-- First add some sales
INSERT INTO daily_deal_flow (
    submission_id, 
    center_id, 
    date, 
    status, 
    call_result,
    insured_name,
    agent
) VALUES 
(
    'TEST-SALE-DQ-001',
    (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
    CURRENT_DATE,
    'Pending Approval',
    'Submitted',
    'DQ Test Customer 1',
    'Test Agent'
);

-- Then add DQ items (this creates quality issues)
INSERT INTO dq_items (
    daily_deal_flow_id,
    center_id,
    dq_category,
    issue_description,
    severity,
    discovered_date
) VALUES 
(
    (SELECT id FROM daily_deal_flow WHERE submission_id = 'TEST-SALE-DQ-001'),
    (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
    'Missing Information',
    'Customer phone number missing',
    'high',
    CURRENT_DATE
);

-- Then run: npx tsx scripts/run_alerts.ts
-- Expected: High DQ alert to QUALITY Slack channel


-- ============================================
-- 4. LOW APPROVAL RATIO ALERT (Goes to QUALITY channel)
-- ============================================
-- This is what you're currently seeing!
-- Add transfers without submissions

INSERT INTO daily_deal_flow (
    submission_id, 
    center_id, 
    date, 
    status, 
    call_result,
    insured_name,
    agent
) VALUES 
(
    'TEST-TRANSFER-001',
    (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
    CURRENT_DATE,
    'Pending Approval',
    'Underwriting',  -- This is a transfer
    'Transfer Customer',
    'Test Agent'
);

-- No submissions added, so ratio is low
-- Then run: npx tsx scripts/run_alerts.ts
-- Expected: Low approval ratio alert to QUALITY Slack channel


-- ============================================
-- 5. MILESTONE ALERT (Goes to SALES channel)
-- ============================================
-- Add enough sales to reach 75%, 100%, or 125% of target

-- Check target first
SELECT center_name, daily_sales_target FROM centers WHERE center_name = 'Phoenix BPO Center';

-- If target is 10, add 10 sales to hit 100%
-- Generate multiple sales:
DO $$
DECLARE
    i INTEGER;
    center_uuid UUID;
BEGIN
    SELECT id INTO center_uuid FROM centers WHERE center_name = 'Phoenix BPO Center';
    
    FOR i IN 1..10 LOOP
        INSERT INTO daily_deal_flow (
            submission_id, 
            center_id, 
            date, 
            status, 
            call_result,
            insured_name,
            agent
        ) VALUES (
            'MILESTONE-SALE-' || i,
            center_uuid,
            CURRENT_DATE,
            'Pending Approval',
            'Submitted',
            'Milestone Customer ' || i,
            'Test Agent'
        );
    END LOOP;
END $$;

-- Then run: npx tsx scripts/run_alerts.ts
-- Expected: Milestone achievement alert to SALES Slack channel


-- ============================================
-- CLEANUP: Remove test data
-- ============================================
DELETE FROM dq_items 
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND discovered_date = CURRENT_DATE;

DELETE FROM daily_deal_flow 
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND date = CURRENT_DATE
AND submission_id LIKE 'TEST-%' OR submission_id LIKE 'MILESTONE-%';


-- ============================================
-- CHECK CURRENT ALERT RULES
-- ============================================
SELECT 
    rule_name,
    trigger_type,
    condition_threshold,
    enabled,
    enable_notifications,
    priority,
    channels
FROM alert_rules
ORDER BY trigger_type;


-- ============================================
-- TOGGLE NOTIFICATIONS FOR SPECIFIC RULES
-- ============================================
-- Disable milestone notifications
UPDATE alert_rules 
SET enable_notifications = false 
WHERE trigger_type = 'milestone';

-- Re-enable
UPDATE alert_rules 
SET enable_notifications = true 
WHERE trigger_type = 'milestone';


-- ============================================
-- CHECK ALERT HISTORY
-- ============================================
SELECT 
    ar.rule_name,
    ar.trigger_type,
    c.center_name,
    als.message,
    als.channels_sent,
    als.sent_at
FROM alerts_sent als
JOIN alert_rules ar ON als.rule_id = ar.id
JOIN centers c ON als.center_id = c.id
WHERE DATE(als.sent_at) = CURRENT_DATE
ORDER BY als.sent_at DESC;


-- ============================================
-- VIEW CURRENT SALES DATA
-- ============================================
SELECT 
    c.center_name,
    c.daily_sales_target,
    COUNT(CASE WHEN ddf.call_result IN ('Submitted', 'Underwriting') THEN 1 END) as total_sales,
    COUNT(CASE WHEN ddf.call_result = 'Submitted' THEN 1 END) as submissions,
    COUNT(CASE WHEN ddf.call_result = 'Underwriting' THEN 1 END) as transfers,
    ROUND(
        (COUNT(CASE WHEN ddf.call_result IN ('Submitted', 'Underwriting') THEN 1 END)::numeric / 
         NULLIF(c.daily_sales_target, 0) * 100), 
        2
    ) as percentage_of_target
FROM centers c
LEFT JOIN daily_deal_flow ddf ON c.id = ddf.center_id AND ddf.date = CURRENT_DATE
WHERE c.status = true
GROUP BY c.id, c.center_name, c.daily_sales_target
ORDER BY c.center_name;
