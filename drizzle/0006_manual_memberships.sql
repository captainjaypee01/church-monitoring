-- Create enums for memberships if they don't exist
DO $$ BEGIN
    CREATE TYPE membership_type AS ENUM ('MEMBER', 'LEADER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leadership_scope AS ENUM ('CELL', 'NETWORK', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
  cell_id UUID REFERENCES cells(id) ON DELETE CASCADE,
  membership_type membership_type NOT NULL DEFAULT 'MEMBER',
  leadership_scope leadership_scope NOT NULL DEFAULT 'NONE',
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_profile_id ON memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_network_id ON memberships(network_id);
CREATE INDEX IF NOT EXISTS idx_memberships_cell_id ON memberships(cell_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_leadership ON memberships(leadership_scope);

-- Create unique constraints to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_unique_network ON memberships(profile_id, network_id) 
WHERE cell_id IS NULL AND status = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_unique_cell ON memberships(profile_id, cell_id) 
WHERE cell_id IS NOT NULL AND status = 'ACTIVE';
