-- Database migration to add usernames table with role-based validation
--
-- This script creates a usernames table that supports different validation rules
-- based on user roles:
-- - 'user' accounts: alphanumeric + underscore/hyphen, no leading/trailing special chars (3-30 chars)
-- - 'organiser'/'company' accounts: can include spaces and dots, up to 100 chars
--
-- Run this script in your PostgreSQL database to create the table and triggers.
-- Note: This uses triggers instead of CHECK constraints to validate usernames based on user role.

-- Drop existing table if needed (be careful in production!)
-- Uncomment the next line only if you need to recreate the table from scratch
-- DROP TABLE IF EXISTS usernames CASCADE;

-- Create usernames table
CREATE TABLE IF NOT EXISTS usernames (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL, -- Increased length to support organization names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT usernames_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT usernames_user_id_unique UNIQUE (user_id),
    CONSTRAINT usernames_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 100),
    -- Basic format check - no leading/trailing spaces
    CONSTRAINT usernames_no_trim_spaces CHECK (username = TRIM(username))
);

-- Create case-insensitive unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_usernames_username_lower_unique
    ON usernames (LOWER(username));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usernames_user_id ON usernames(user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_usernames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_usernames_updated_at_trigger ON usernames;
CREATE TRIGGER update_usernames_updated_at_trigger
    BEFORE UPDATE ON usernames
    FOR EACH ROW
    EXECUTE FUNCTION update_usernames_updated_at();

-- Create function to validate username format based on user role
CREATE OR REPLACE FUNCTION validate_username_format()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    -- Get the user's role
    SELECT role INTO v_role FROM users WHERE id = NEW.user_id;

    -- Check if user exists
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'No user found for user_id=%', NEW.user_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Trim spaces check (already handled by constraint, but double-check)
    IF NEW.username <> TRIM(NEW.username) THEN
        RAISE EXCEPTION 'Username cannot have leading or trailing spaces';
    END IF;

    -- Different validation based on role
    IF v_role = 'user' THEN
        -- For regular users: alphanumeric + underscore/hyphen
        -- Must start and end with alphanumeric
        IF LENGTH(NEW.username) = 1 THEN
            -- Single character must be alphanumeric
            IF NEW.username !~ '^[a-zA-Z0-9]$' THEN
                RAISE EXCEPTION 'Single character username must be a letter or number.';
            END IF;
        ELSIF LENGTH(NEW.username) = 2 THEN
            -- Two characters must both be alphanumeric
            IF NEW.username !~ '^[a-zA-Z0-9]{2}$' THEN
                RAISE EXCEPTION 'Two character username must contain only letters or numbers.';
            END IF;
        ELSE
            -- 3+ characters: alphanumeric at start/end, can have underscore/hyphen in middle
            IF NEW.username !~ '^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$' THEN
                RAISE EXCEPTION 'Invalid username for users. Must contain only letters, numbers, underscores, and hyphens. Cannot start or end with underscore or hyphen.';
            END IF;
        END IF;
    ELSE
        -- For organisers and companies: allow spaces and more characters
        -- Must start and end with alphanumeric, can contain spaces/dots/underscores/hyphens in between
        IF NEW.username !~ '^[a-zA-Z0-9]([a-zA-Z0-9 ._-]*[a-zA-Z0-9])?$' THEN
            RAISE EXCEPTION 'Invalid organization username. Must start and end with letters or numbers. Can contain spaces, dots, underscores, and hyphens in between.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username validation
DROP TRIGGER IF EXISTS validate_username_format_trigger ON usernames;
CREATE TRIGGER validate_username_format_trigger
    BEFORE INSERT OR UPDATE ON usernames
    FOR EACH ROW
    EXECUTE FUNCTION validate_username_format();

-- Add comments for documentation
COMMENT ON TABLE usernames IS 'Stores unique usernames for forum users';
COMMENT ON COLUMN usernames.user_id IS 'Foreign key reference to users.id';
COMMENT ON COLUMN usernames.username IS 'Unique username with role-based validation (3-100 characters)';
COMMENT ON COLUMN usernames.created_at IS 'Timestamp when username was created';
COMMENT ON COLUMN usernames.updated_at IS 'Timestamp when username was last updated';