-- ============================================
-- QUICK START: Add Sales Data to Test Alerts
-- ============================================
-- Copy and paste these queries into Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query

-- ============================================
-- STEP 1: Check Your Center's Target
-- ============================================
SELECT 
    center_name, 
    daily_sales_target,
    slack_webhook_url
FROM centers 
WHERE center_name = 'Phoenix BPO Center';

-- Note the daily_sales_target (e.g., 10)


-- ============================================
-- STEP 2: Add Sales (Choose ONE option below)
-- ============================================

-- OPTION A: Add 5 Sales (50% of target if target is 10)
-- This will trigger LOW SALES alert → SALES Channel
INSERT INTO daily_deal_flow (
    submission_id, center_id, date, status, call_result, insured_name, agent, monthly_premium
) VALUES 
('QUICK-SALE-1', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'John Smith', 'Agent Mike', 125.00),
('QUICK-SALE-2', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Jane Doe', 'Agent Sarah', 150.00),
('QUICK-SALE-3', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Bob Johnson', 'Agent Mike', 175.00),
('QUICK-SALE-4', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Alice Brown', 'Agent Tom', 200.00),
('QUICK-SALE-5', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Charlie Davis', 'Agent Sarah', 100.00);


-- OPTION B: Add 10 Sales (100% of target if target is 10)
-- This will trigger MILESTONE alert → SALES Channel
DO $$
DECLARE i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO daily_deal_flow (
            submission_id, center_id, date, status, call_result, insured_name, agent, monthly_premium
        ) VALUES (
            'MILESTONE-SALE-' || i,
            (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'),
            CURRENT_DATE,
            'Pending Approval',
            'Submitted',
            'Customer ' || i,
            'Agent ' || (i % 3 + 1),
            100.00 + (i * 10)
        );
    END LOOP;
END $$;


-- OPTION C: Add Mixed Data (Low Approval Ratio)
-- This will trigger LOW APPROVAL alert → QUALITY Channel
INSERT INTO daily_deal_flow (
    submission_id, center_id, date, status, call_result, insured_name, agent
) VALUES 
-- 2 Submissions
('MIX-SUB-1', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Good Customer 1', 'Agent A'),
('MIX-SUB-2', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Submitted', 'Good Customer 2', 'Agent B'),
-- 5 Transfers (will trigger low approval alert)
('MIX-TRF-1', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Underwriting', 'Transfer Customer 1', 'Agent C'),
('MIX-TRF-2', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Underwriting', 'Transfer Customer 2', 'Agent D'),
('MIX-TRF-3', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Underwriting', 'Transfer Customer 3', 'Agent E'),
('MIX-TRF-4', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Underwriting', 'Transfer Customer 4', 'Agent F'),
('MIX-TRF-5', (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center'), CURRENT_DATE, 'Pending Approval', 'Underwriting', 'Transfer Customer 5', 'Agent G');


-- ============================================
-- STEP 3: Verify Data Was Added
-- ============================================
SELECT 
    c.center_name,
    c.daily_sales_target,
    COUNT(CASE WHEN ddf.call_result = 'Submitted' THEN 1 END) as submissions,
    COUNT(CASE WHEN ddf.call_result = 'Underwriting' THEN 1 END) as transfers,
    COUNT(*) as total_sales,
    ROUND((COUNT(*)::numeric / c.daily_sales_target * 100), 2) as percentage_of_target
FROM centers c
LEFT JOIN daily_deal_flow ddf ON c.id = ddf.center_id AND ddf.date = CURRENT_DATE
WHERE c.center_name = 'Phoenix BPO Center'
GROUP BY c.id, c.center_name, c.daily_sales_target;


-- ============================================
-- STEP 4: View All Today's Sales
-- ============================================
SELECT 
    submission_id,
    insured_name,
    agent,
    call_result,
    monthly_premium,
    TO_CHAR(created_at, 'HH24:MI:SS') as time_created
FROM daily_deal_flow
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND date = CURRENT_DATE
ORDER BY created_at DESC;


-- ============================================
-- STEP 5: Run Alert Evaluation
-- ============================================
-- After adding data, go to your terminal and run:
-- npx tsx scripts/run_alerts.ts


-- ============================================
-- CLEANUP: Remove Test Data
-- ============================================
-- Run this when you want to start fresh
DELETE FROM daily_deal_flow 
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND date = CURRENT_DATE
AND (
    submission_id LIKE 'QUICK-%' OR 
    submission_id LIKE 'MILESTONE-%' OR 
    submission_id LIKE 'MIX-%'
);

-- Verify cleanup
SELECT COUNT(*) as remaining_sales
FROM daily_deal_flow
WHERE center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND date = CURRENT_DATE;


-- ============================================
-- BONUS: Check Alert History
-- ============================================
SELECT 
    ar.rule_name,
    ar.trigger_type,
    als.message,
    als.channels_sent,
    TO_CHAR(als.sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_time
FROM alerts_sent als
JOIN alert_rules ar ON als.rule_id = ar.id
WHERE als.center_id = (SELECT id FROM centers WHERE center_name = 'Phoenix BPO Center')
AND DATE(als.sent_at) = CURRENT_DATE
ORDER BY als.sent_at DESC;
