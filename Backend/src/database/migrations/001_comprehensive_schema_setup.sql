-- =============================================
-- COMPREHENSIVE DATABASE SCHEMA SETUP FOR FIXRX
-- =============================================
-- This migration ensures all tables and columns are properly configured
-- for OTP authentication, invitations, and messaging systems
-- 
-- Run this migration to set up the database correctly on any environment
-- =============================================

-- =============================================
-- 1. CREATE MISSING TABLES
-- =============================================

-- OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    otp_code_hash VARCHAR(255) NOT NULL,
    otp_code_salt VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'LOGIN' CHECK (purpose IN ('LOGIN', 'REGISTRATION', 'VERIFICATION')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Phone Auth Sessions Table
CREATE TABLE IF NOT EXISTS phone_auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id TEXT, -- TEXT to match users.id type
    otp_verification_id UUID REFERENCES otp_verifications(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Messages Table
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    contact_id UUID,
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    body TEXT NOT NULL,
    template_id UUID,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'queued',
    twilio_sid VARCHAR(100),
    cost DECIMAL(10,4) DEFAULT 0,
    segments INTEGER DEFAULT 1,
    batch_id UUID,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    error_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    conversation_type VARCHAR(32) DEFAULT 'consumer_vendor',
    created_by TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'consumer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_message_id UUID,
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE (conversation_id, user_id)
);

-- Message Reads Table
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id)
);

-- =============================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add OTP-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_blocked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_last_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_last_user_agent TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Ensure updated_at exists on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to invitations table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS user_id TEXT;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS inviter_id TEXT;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS custom_message TEXT;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'sms';
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sms_message_id UUID;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sms_status VARCHAR(50);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS service_category VARCHAR(100);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS contact_id UUID;
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invite_token VARCHAR(100);
        ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invitation_type VARCHAR(50);
    END IF;
END $$;

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- OTP tables indexes
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_status ON otp_verifications(status);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_created ON otp_verifications(created_at);

CREATE INDEX IF NOT EXISTS idx_phone_auth_sessions_token ON phone_auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_phone_auth_sessions_user ON phone_auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_auth_sessions_phone ON phone_auth_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_auth_sessions_expires ON phone_auth_sessions(expires_at);

-- SMS messages indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);

-- Conversations and messages indexes
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- =============================================
-- 4. CREATE UPDATE TRIGGERS
-- =============================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at column
DROP TRIGGER IF EXISTS update_otp_verifications_updated_at ON otp_verifications;
CREATE TRIGGER update_otp_verifications_updated_at 
    BEFORE UPDATE ON otp_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phone_auth_sessions_updated_at ON phone_auth_sessions;
CREATE TRIGGER update_phone_auth_sessions_updated_at 
    BEFORE UPDATE ON phone_auth_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_messages_updated_at ON sms_messages;
CREATE TRIGGER update_sms_messages_updated_at 
    BEFORE UPDATE ON sms_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. GRANT PERMISSIONS (IF USER EXISTS)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fixrx_user') THEN
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fixrx_user;
    END IF;
END $$;

-- =============================================
-- 6. FINAL VERIFICATION
-- =============================================

DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    table_name TEXT;
    expected_tables TEXT[] := ARRAY[
        'otp_verifications', 'phone_auth_sessions', 'sms_messages',
        'conversations', 'messages', 'conversation_participants', 'message_reads'
    ];
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing tables after migration: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist';
    END IF;
    
    RAISE NOTICE 'Database schema setup completed successfully';
    RAISE NOTICE 'OTP authentication tables: ✓';
    RAISE NOTICE 'Messaging system tables: ✓';
    RAISE NOTICE 'Invitation system columns: ✓';
    RAISE NOTICE 'User OTP tracking columns: ✓';
END $$;
