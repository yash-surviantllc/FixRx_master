-- Add email_verified_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Add phone_verified_at column if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Update existing verified users
UPDATE users 
SET email_verified_at = created_at 
WHERE email_verified = true AND email_verified_at IS NULL;
