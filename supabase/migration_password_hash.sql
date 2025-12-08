-- Migration: Update users table to use password_hash instead of auth_id
-- Run this in your Supabase SQL Editor

-- Step 1: Add password_hash column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- Step 2: Make auth_id nullable (for migration)
ALTER TABLE public.users ALTER COLUMN auth_id DROP NOT NULL;

-- Step 3: If you want to completely remove Supabase Auth dependency, run this:
-- (WARNING: This will delete the auth_id column. Only run if you're sure!)
-- ALTER TABLE public.users DROP COLUMN IF EXISTS auth_id;

-- Step 4: Ensure password_hash is required for new users
-- After migration, you can make it NOT NULL:
-- ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;

-- Note: Existing users with auth_id will need to be migrated or have passwords set manually
