-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    owner_id UUID, -- Circular dependency with users table handled by application logic (Insert Org -> Insert User -> Update Org)
    tags TEXT[], -- GIN index can be added later if tag search becomes frequent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- If org is deleted, delete users
    org_name VARCHAR(255), -- Cached for performance, but application should sync with org_id usually
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    logo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expiry TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    reset_token_used BOOLEAN DEFAULT FALSE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for frequent lookup of users by organization
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- If org is deleted, delete coupons
    org_name VARCHAR(255),
    code VARCHAR(50) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    level VARCHAR(20) NOT NULL CHECK (level IN ('cart_level', 'tag_level')),
    discount_amount DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2) DEFAULT 0,
    applicable_tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    visible BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_code_per_org UNIQUE (org_id, code) -- Critical for SaaS: uniqueness scoped to org
);

-- Index for frequent lookup of coupons by organization
CREATE INDEX IF NOT EXISTS idx_coupons_org_id ON coupons(org_id);

-- Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    org_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE, -- Tokens must be globally unique for safe lookup
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL, -- If inviter is deleted, keep the invite but clear the link
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for looking up invitations by email (e.g. "Do I have any pending invites?")
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
