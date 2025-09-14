-- Create new memberships table to replace cellMemberships
CREATE TYPE membership_type AS ENUM ('MEMBER', 'LEADER');
CREATE TYPE leadership_scope AS ENUM ('CELL', 'NETWORK', 'NONE');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TABLE memberships (
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
CREATE INDEX idx_memberships_profile_id ON memberships(profile_id);
CREATE INDEX idx_memberships_network_id ON memberships(network_id);
CREATE INDEX idx_memberships_cell_id ON memberships(cell_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_leadership ON memberships(leadership_scope);

-- Create unique constraints to prevent duplicate memberships
CREATE UNIQUE INDEX idx_memberships_unique_network ON memberships(profile_id, network_id) 
WHERE cell_id IS NULL AND status = 'ACTIVE';

CREATE UNIQUE INDEX idx_memberships_unique_cell ON memberships(profile_id, cell_id) 
WHERE cell_id IS NOT NULL AND status = 'ACTIVE';

-- Migrate data from cellMemberships to new memberships table
INSERT INTO memberships (
  profile_id, 
  cell_id, 
  network_id, 
  membership_type, 
  leadership_scope,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT 
  cm.profile_id,
  cm.cell_id,
  c.network_id,
  CASE 
    WHEN cm.role_in_cell = 'LEADER' THEN 'LEADER'::membership_type
    ELSE 'MEMBER'::membership_type
  END,
  CASE 
    WHEN cm.role_in_cell = 'LEADER' THEN 'CELL'::leadership_scope
    ELSE 'NONE'::leadership_scope
  END,
  'ACTIVE'::membership_status,
  cm.created_at,
  cm.created_at,
  cm.updated_at
FROM cell_memberships cm
JOIN cells c ON cm.cell_id = c.id;

-- Add network leader memberships from userRoles
INSERT INTO memberships (
  profile_id, 
  network_id, 
  membership_type, 
  leadership_scope,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT 
  p.id as profile_id,
  ur.network_id,
  'LEADER'::membership_type,
  'NETWORK'::leadership_scope,
  'ACTIVE'::membership_status,
  ur.created_at,
  ur.created_at,
  ur.updated_at
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'NETWORK_LEADER' 
AND ur.network_id IS NOT NULL
AND NOT EXISTS (
  -- Don't duplicate if they already have a cell membership in the same network
  SELECT 1 FROM memberships m 
  WHERE m.profile_id = p.id 
  AND m.network_id = ur.network_id
);

-- Drop old cellMemberships table (commented out for safety)
-- DROP TABLE cell_memberships;
