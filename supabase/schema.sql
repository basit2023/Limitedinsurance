

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alert_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  trigger_type text NOT NULL,
  condition_threshold numeric,
  alert_message_template text,
  recipient_roles ARRAY,
  channels ARRAY,
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
CREATE TABLE public.alerts_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid,
  center_id uuid,
  alert_type text,
  message text,
  channels_sent ARRAY,
  recipients ARRAY,
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
CREATE TABLE public.centers (
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
CREATE TABLE public.corrective_actions (
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
CREATE TABLE public.dq_items (
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
  CONSTRAINT dq_items_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT dq_items_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id)
);
CREATE TABLE public.mobile_devices (
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
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  alert_type text,
  channels_enabled ARRAY,
  quiet_hours_start time without time zone,
  quiet_hours_end time without time zone,
  frequency_cap_minutes integer DEFAULT 0,
  digest_mode boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_types (
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
CREATE TABLE public.users (
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