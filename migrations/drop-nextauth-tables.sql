-- Drop NextAuth-specific tables
-- These tables are no longer needed after switching to custom authentication

-- Drop verification tokens table
DROP TABLE IF EXISTS "verificationToken" CASCADE;

-- Drop sessions table
DROP TABLE IF EXISTS "session" CASCADE;

-- Drop accounts table
DROP TABLE IF EXISTS "account" CASCADE;

-- Note: We keep the users table as it's still needed for our custom authentication
-- The users table already has the password field needed for manual authentication
