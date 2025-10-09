-- Contact Management Tables Migration for FixRx
-- Creates tables for contact management, bulk operations, and invitation system

-- =============================================
-- CONTACTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  company VARCHAR(255),
  job_title VARCHAR(255),
  source VARCHAR(50) DEFAULT 'manual', -- manual, imported, synced, invitation
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}', -- Array of tags for organization
  notes TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT contacts_user_phone_unique UNIQUE(user_id, phone),
  CONSTRAINT contacts_user_email_unique UNIQUE(user_id, email),
  CONSTRAINT contacts_phone_or_email_required CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);

-- =============================================
-- CONTACT IMPORT BATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contact_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_name VARCHAR(255),
  total_contacts INTEGER DEFAULT 0,
  processed_contacts INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  import_source VARCHAR(100), -- csv, vcf, google, apple, manual, etc.
  error_log TEXT[],
  file_path VARCHAR(500),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for contact import batches
CREATE INDEX IF NOT EXISTS idx_import_batches_user_id ON contact_import_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON contact_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created ON contact_import_batches(created_at);

-- =============================================
-- SMS MESSAGES TABLE (Enhanced Twilio Integration)
-- =============================================
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  to_number VARCHAR(20) NOT NULL,
  from_number VARCHAR(20),
  body TEXT NOT NULL,
  template_id UUID,
  priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
  status VARCHAR(50) DEFAULT 'queued', -- queued, sent, delivered, failed, undelivered
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

-- Indexes for SMS messages
CREATE INDEX IF NOT EXISTS idx_sms_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_contact_id ON sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_twilio_sid ON sms_messages(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_sms_batch_id ON sms_messages(batch_id);
CREATE INDEX IF NOT EXISTS idx_sms_to_number ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_messages(created_at);

-- =============================================
-- SMS BULK BATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sms_bulk_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_name VARCHAR(255),
  total_messages INTEGER DEFAULT 0,
  processed_messages INTEGER DEFAULT 0,
  successful_messages INTEGER DEFAULT 0,
  failed_messages INTEGER DEFAULT 0,
  queued_messages INTEGER DEFAULT 0,
  template_id UUID,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for SMS bulk batches
CREATE INDEX IF NOT EXISTS idx_sms_batches_user_id ON sms_bulk_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_batches_status ON sms_bulk_batches(status);
CREATE INDEX IF NOT EXISTS idx_sms_batches_created ON sms_bulk_batches(created_at);

-- =============================================
-- INVITATIONS TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_name VARCHAR(255),
  message TEXT,
  invitation_type VARCHAR(50) DEFAULT 'vendor_invite', -- vendor_invite, consumer_invite, platform_invite
  delivery_method VARCHAR(20) DEFAULT 'email', -- email, sms, both
  invite_token VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, accepted, expired, cancelled, failed
  expires_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  accepted_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  resent_count INTEGER DEFAULT 0,
  last_resent_at TIMESTAMP,
  delivery_results JSONB,
  error_messages TEXT[],
  acceptance_data JSONB,
  sms_id UUID REFERENCES sms_messages(id) ON DELETE SET NULL,
  email_id UUID, -- Reference to email service
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT invitations_recipient_required CHECK (recipient_email IS NOT NULL OR recipient_phone IS NOT NULL),
  CONSTRAINT invitations_delivery_method_check CHECK (delivery_method IN ('email', 'sms', 'both')),
  CONSTRAINT invitations_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'accepted', 'expired', 'cancelled', 'failed'))
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_contact_id ON invitations(contact_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON invitations(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_created ON invitations(created_at);

-- =============================================
-- INVITATION BULK BATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invitation_bulk_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_name VARCHAR(255),
  total_invitations INTEGER DEFAULT 0,
  processed_invitations INTEGER DEFAULT 0,
  successful_invitations INTEGER DEFAULT 0,
  failed_invitations INTEGER DEFAULT 0,
  duplicate_invitations INTEGER DEFAULT 0,
  delivery_method VARCHAR(20),
  invitation_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  template_message TEXT,
  expires_in_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for invitation bulk batches
CREATE INDEX IF NOT EXISTS idx_invitation_batches_user_id ON invitation_bulk_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_batches_status ON invitation_bulk_batches(status);
CREATE INDEX IF NOT EXISTS idx_invitation_batches_created ON invitation_bulk_batches(created_at);

-- =============================================
-- INVITATION LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invitation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- created, sent, delivered, opened, clicked, accepted, expired, cancelled, resent
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for invitation logs
CREATE INDEX IF NOT EXISTS idx_invitation_logs_invitation_id ON invitation_logs(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_action ON invitation_logs(action);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_created ON invitation_logs(created_at);

-- =============================================
-- SMS TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Available variables for substitution
  category VARCHAR(100), -- invitation, notification, marketing, etc.
  is_system BOOLEAN DEFAULT false, -- System templates vs user templates
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for SMS templates
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_templates_system ON sms_templates(is_system);

-- =============================================
-- CONTACT SYNC SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contact_sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  sync_type VARCHAR(50), -- full, incremental, manual
  total_device_contacts INTEGER DEFAULT 0,
  new_contacts INTEGER DEFAULT 0,
  updated_contacts INTEGER DEFAULT 0,
  deleted_contacts INTEGER DEFAULT 0,
  conflicts INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for contact sync sessions
CREATE INDEX IF NOT EXISTS idx_sync_sessions_user_id ON contact_sync_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_device ON contact_sync_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON contact_sync_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_started ON contact_sync_sessions(started_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT SMS TEMPLATES
-- =============================================
INSERT INTO sms_templates (name, description, body, variables, category, is_system, is_active) VALUES
('Vendor Invitation', 'Default template for vendor invitations', 'Hi {{recipientName}}! You''re invited to join FixRx as a vendor. {{message}} Join here: {{inviteLink}}', '{"recipientName": "Recipient name", "message": "Custom message", "inviteLink": "Invitation link"}', 'invitation', true, true),
('Consumer Invitation', 'Default template for consumer invitations', 'Hi {{recipientName}}! Join FixRx to find trusted service providers. {{message}} Get started: {{inviteLink}}', '{"recipientName": "Recipient name", "message": "Custom message", "inviteLink": "Invitation link"}', 'invitation', true, true),
('Service Request Notification', 'Notify vendors of new service requests', 'New service request in your area! {{serviceType}} needed by {{consumerName}}. View details in your FixRx app.', '{"serviceType": "Type of service", "consumerName": "Consumer name"}', 'notification', true, true),
('Rating Reminder', 'Remind users to rate completed services', 'Hi {{userName}}! Please rate your recent {{serviceType}} experience with {{vendorName}}. Your feedback helps others!', '{"userName": "User name", "serviceType": "Service type", "vendorName": "Vendor name"}', 'reminder', true, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE contacts IS 'Stores user contacts with import/sync capabilities and organization features';
COMMENT ON TABLE contact_import_batches IS 'Tracks bulk contact import operations with status and error logging';
COMMENT ON TABLE sms_messages IS 'Enhanced SMS message tracking with Twilio integration and delivery status';
COMMENT ON TABLE sms_bulk_batches IS 'Manages bulk SMS operations with rate limiting compliance';
COMMENT ON TABLE invitations IS 'Comprehensive invitation system with multi-channel delivery and tracking';
COMMENT ON TABLE invitation_bulk_batches IS 'Tracks bulk invitation operations with detailed analytics';
COMMENT ON TABLE invitation_logs IS 'Detailed audit trail for all invitation-related actions';
COMMENT ON TABLE sms_templates IS 'Reusable SMS templates with variable substitution';
COMMENT ON TABLE contact_sync_sessions IS 'Tracks device contact synchronization sessions';

COMMENT ON COLUMN contacts.source IS 'Source of contact: manual, imported, synced, invitation';
COMMENT ON COLUMN contacts.tags IS 'Array of user-defined tags for contact organization';
COMMENT ON COLUMN invitations.delivery_method IS 'How invitation is delivered: email, sms, or both';
COMMENT ON COLUMN invitations.invite_token IS 'Unique token for invitation acceptance';
COMMENT ON COLUMN invitations.delivery_results IS 'JSON object containing delivery status from SMS/email services';
COMMENT ON COLUMN sms_messages.segments IS 'Number of SMS segments for cost calculation';
COMMENT ON COLUMN sms_templates.variables IS 'JSON object defining available template variables';
