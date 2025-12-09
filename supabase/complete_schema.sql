-- Complete Schema for Insurance Sales Alert Portal Dashboard
-- This includes all existing and new tables for the system

-- ============================================================================
-- CORE TABLES (Already Existing)
-- ============================================================================

-- user_types table (already exists)
CREATE TABLE IF NOT EXISTS public.user_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permission_level integer NOT NULL,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_view boolean DEFAULT true,
  status boolean DEFAULT true,
  description text,
  CONSTRAINT user_types_pkey PRIMARY KEY (id)
);

-- users table (already exists)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  user_type_id uuid,
  status boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.user_types(id)
);

-- ============================================================================
-- NEW CORE TABLES FOR DASHBOARD SYSTEM
-- ============================================================================

-- Centers Master Data
CREATE TABLE IF NOT EXISTS public.centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  center_name text NOT NULL,
  location text,
  manager_id uuid,
  region text,
  daily_sales_target numeric DEFAULT 0,
  status boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT centers_pkey PRIMARY KEY (id),
  CONSTRAINT centers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id)
);

-- Daily Deal Flow (Main Transaction Table)
CREATE TABLE IF NOT EXISTS public.daily_deal_flow (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id text,
  client_phone_number text,
  lead_vendor text,
  date date NOT NULL,
  insured_name text,
  buffer_agent text,
  agent text,
  licensed_agent_account text,
  status text,
  call_result text,
  carrier text,
  product_type text,
  draft_date date,
  monthly_premium numeric,
  face_amount numeric,
  policy_number text,
  placement_status text,
  carrier_audit text,
  retention_agent text,
  ghl_location_id text,
  ghl_opportunity_id text,
  from_callback boolean DEFAULT false,
  is_callback boolean DEFAULT false,
  is_retention_call boolean DEFAULT false,
  sync_status text,
  center_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT daily_deal_flow_pkey PRIMARY KEY (id),
  CONSTRAINT daily_deal_flow_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id)
);

-- DQ Items (Quality Data)
CREATE TABLE IF NOT EXISTS public.dq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  daily_deal_flow_id uuid,
  center_id uuid,
  agent_id uuid,
  dq_category text,
  issue_description text,
  severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  discovered_date date,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT dq_items_pkey PRIMARY KEY (id),
  CONSTRAINT dq_items_daily_deal_flow_id_fkey FOREIGN KEY (daily_deal_flow_id) REFERENCES public.daily_deal_flow(id),
  CONSTRAINT dq_items_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT dq_items_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id)
);

-- Corrective Actions (QA/Compliance)
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dq_item_id uuid,
  center_id uuid,
  assigned_to uuid,
  issue_description text,
  status text DEFAULT 'assigned'::text CHECK (status = ANY (ARRAY['assigned'::text, 'in_progress'::text, 'completed'::text, 'verified'::text])),
  target_date date,
  notes text,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT corrective_actions_pkey PRIMARY KEY (id),
  CONSTRAINT corrective_actions_dq_item_id_fkey FOREIGN KEY (dq_item_id) REFERENCES public.dq_items(id),
  CONSTRAINT corrective_actions_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT corrective_actions_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT corrective_actions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Alert Rules (Alert Configuration)
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  trigger_type text NOT NULL,
  condition_threshold numeric,
  alert_message_template text,
  recipient_roles text[],
  channels text[],
  priority text CHECK (priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text])),
  enabled boolean DEFAULT true,
  quiet_hours_start time without time zone,
  quiet_hours_end time without time zone,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT alert_rules_pkey PRIMARY KEY (id),
  CONSTRAINT alert_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Alerts Sent (Audit Trail)
CREATE TABLE IF NOT EXISTS public.alerts_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid,
  center_id uuid,
  alert_type text,
  message text,
  channels_sent text[],
  recipients text[],
  sent_at timestamp without time zone DEFAULT now(),
  acknowledged_by uuid,
  acknowledged_at timestamp without time zone,
  response_action text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT alerts_sent_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_sent_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.alert_rules(id),
  CONSTRAINT alerts_sent_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT alerts_sent_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id)
);

-- Notification Preferences (User Settings)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  alert_type text,
  channels_enabled text[],
  quiet_hours_start time without time zone,
  quiet_hours_end time without time zone,
  frequency_cap_minutes integer DEFAULT 0,
  digest_mode boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Mobile Devices (iOS/Android Registration)
CREATE TABLE IF NOT EXISTS public.mobile_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  device_token text NOT NULL,
  device_type text CHECK (device_type = ANY (ARRAY['iOS'::text, 'Android'::text])),
  device_name text,
  app_version text,
  os_version text,
  is_active boolean DEFAULT true,
  last_seen_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT mobile_devices_pkey PRIMARY KEY (id),
  CONSTRAINT mobile_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_center_date 
  ON public.daily_deal_flow(center_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_agent_date 
  ON public.daily_deal_flow(agent, date);

CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_status 
  ON public.daily_deal_flow(status, call_result);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_center_date 
  ON public.alerts_sent(center_id, sent_at);

CREATE INDEX IF NOT EXISTS idx_dq_items_center_date 
  ON public.dq_items(center_id, created_at);

CREATE INDEX IF NOT EXISTS idx_corrective_actions_status 
  ON public.corrective_actions(status, target_date);

CREATE INDEX IF NOT EXISTS idx_daily_deal_flow_date 
  ON public.daily_deal_flow(date DESC);

CREATE INDEX IF NOT EXISTS idx_centers_status 
  ON public.centers(status) WHERE status = true;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample user types if not exists
INSERT INTO public.user_types (name, permission_level, can_create, can_edit, can_delete, can_view, status, description)
VALUES 
  ('Admin', 100, true, true, true, true, true, 'Full system access'),
  ('Sales Manager', 70, true, true, false, true, true, 'Can manage sales and view reports'),
  ('Center Director', 50, true, true, false, true, true, 'Can manage center operations'),
  ('QA Lead', 60, true, true, false, true, true, 'Can manage quality and compliance'),
  ('Viewer', 15, false, false, false, true, true, 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Insert sample centers
INSERT INTO public.centers (center_name, location, region, daily_sales_target, status)
VALUES 
  ('BPO Center Alpha', 'New York', 'Northeast', 10, true),
  ('BPO Center Beta', 'Los Angeles', 'West', 15, true),
  ('BPO Center Gamma', 'Chicago', 'Midwest', 12, true),
  ('BPO Center Delta', 'Houston', 'South', 8, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON public.centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_deal_flow_updated_at BEFORE UPDATE ON public.daily_deal_flow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corrective_actions_updated_at BEFORE UPDATE ON public.corrective_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON public.alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobile_devices_updated_at BEFORE UPDATE ON public.mobile_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for daily center performance
CREATE OR REPLACE VIEW public.daily_center_performance AS
SELECT 
  c.id as center_id,
  c.center_name,
  ddf.date,
  COUNT(*) as total_transfers,
  COUNT(*) FILTER (WHERE ddf.status = 'Pending Approval' AND ddf.call_result = 'Submitted') as total_sales,
  COUNT(*) FILTER (WHERE ddf.status = 'Pending Approval' AND ddf.call_result = 'Underwriting') as total_underwriting,
  COUNT(*) FILTER (WHERE ddf.status = 'Pending Approval') as pending_approvals,
  COUNT(*) FILTER (WHERE ddf.from_callback = true OR ddf.is_callback = true) as callbacks,
  c.daily_sales_target,
  ROUND((COUNT(*) FILTER (WHERE ddf.status = 'Pending Approval')::numeric / NULLIF(COUNT(*), 0) * 100), 2) as approval_rate
FROM public.centers c
LEFT JOIN public.daily_deal_flow ddf ON c.id = ddf.center_id
GROUP BY c.id, c.center_name, ddf.date, c.daily_sales_target;

-- View for DQ summary by center
CREATE OR REPLACE VIEW public.dq_summary_by_center AS
SELECT 
  c.id as center_id,
  c.center_name,
  DATE(dq.created_at) as date,
  COUNT(*) as total_dq_items,
  COUNT(*) FILTER (WHERE dq.severity = 'high') as high_severity,
  COUNT(*) FILTER (WHERE dq.severity = 'medium') as medium_severity,
  COUNT(*) FILTER (WHERE dq.severity = 'low') as low_severity
FROM public.centers c
LEFT JOIN public.dq_items dq ON c.id = dq.center_id
GROUP BY c.id, c.center_name, DATE(dq.created_at);
