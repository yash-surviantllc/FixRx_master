-- Add is_verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_verified added to users table';
    ELSE
        RAISE NOTICE 'Column is_verified already exists';
    END IF;
END $$;

-- Update existing users to be verified if they have email_verified_at set
UPDATE users SET is_verified = TRUE WHERE email_verified_at IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

SELECT 'Migration completed successfully' AS status;
