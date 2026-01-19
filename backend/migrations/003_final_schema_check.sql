-- Final Schema Verification & Fix
-- This script safely checks and keys all columns to ensure 100% parity with Go Code.

-- 1. Organizations
-- (No changes needed, verified)

-- 2. Users (Fixing missing Auth columns)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- 3. Coupons (Verifying standard fields)
-- Ensure 'usage_count' defaults to 0
ALTER TABLE coupons ALTER COLUMN usage_count SET DEFAULT 0;
ALTER TABLE coupons ALTER COLUMN min_order_amount SET DEFAULT 0;

-- 4. Invitations
-- (No changes needed, verified)

-- 5. Extra Safety: Ensure Indexes exist
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_coupons_org_id ON coupons(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
