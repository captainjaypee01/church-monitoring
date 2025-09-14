-- Simplify database schema by merging profiles, user_roles, memberships into users table
-- This migration will drop complex tables and create a simplified structure

-- First, backup existing user data (in case needed for recovery)
-- CREATE TABLE backup_users AS SELECT * FROM users;
-- CREATE TABLE backup_profiles AS SELECT * FROM profiles;
-- CREATE TABLE backup_user_roles AS SELECT * FROM user_roles;
-- CREATE TABLE backup_memberships AS SELECT * FROM memberships;

-- Drop foreign key constraints and obsolete tables
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS cell_memberships CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop obsolete enums
DROP TYPE IF EXISTS cell_role CASCADE;
DROP TYPE IF EXISTS membership_type CASCADE;
DROP TYPE IF EXISTS leadership_scope CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;

-- Drop and recreate users table with all merged fields
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with simplified structure
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Profile fields (merged from profiles table)
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    birthdate DATE,
    gender gender,
    address TEXT,
    
    -- Role & Assignment fields (merged from user_roles & memberships)
    role role DEFAULT 'MEMBER' NOT NULL,
    network_id UUID REFERENCES networks(id) ON DELETE SET NULL,
    cell_id UUID REFERENCES cells(id) ON DELETE SET NULL,
    
    -- Leadership flags
    is_network_leader BOOLEAN DEFAULT false NOT NULL,
    is_cell_leader BOOLEAN DEFAULT false NOT NULL,
    
    -- Status fields
    is_active BOOLEAN DEFAULT true NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Remove leaderId column from cells table since we now use leadership flags
ALTER TABLE cells DROP COLUMN IF EXISTS leader_id;

-- Update other tables to reference users instead of profiles
ALTER TABLE training_progress DROP COLUMN IF EXISTS profile_id;
ALTER TABLE training_progress ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE meeting_attendance DROP COLUMN IF EXISTS profile_id;
ALTER TABLE meeting_attendance ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE service_attendance DROP COLUMN IF EXISTS profile_id;
ALTER TABLE service_attendance ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE event_registrations DROP COLUMN IF EXISTS profile_id;
ALTER TABLE event_registrations ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE volunteer_assignments DROP COLUMN IF EXISTS profile_id;
ALTER TABLE volunteer_assignments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create some initial test data
INSERT INTO users (
    email, 
    username, 
    hashed_password, 
    name, 
    first_name, 
    last_name, 
    full_name, 
    role,
    is_active
) VALUES 
(
    'admin@church.com',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
    'Administrator',
    'System',
    'Administrator', 
    'System Administrator',
    'ADMIN',
    true
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_network_id ON users(network_id);
CREATE INDEX idx_users_cell_id ON users(cell_id);
CREATE INDEX idx_users_is_network_leader ON users(is_network_leader);
CREATE INDEX idx_users_is_cell_leader ON users(is_cell_leader);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
