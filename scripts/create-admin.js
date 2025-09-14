const bcrypt = require('bcryptjs');

// Hash the password
const hashedPassword = bcrypt.hashSync('password', 12);

console.log('Copy this SQL and run it in Drizzle Studio:');
console.log(`
INSERT INTO users (
  email, 
  username, 
  hashed_password, 
  name, 
  first_name, 
  last_name, 
  full_name, 
  role, 
  is_active,
  is_network_leader,
  is_cell_leader,
  joined_at,
  created_at,
  updated_at
) VALUES (
  'admin@church.com',
  'admin',
  '${hashedPassword}',
  'Administrator',
  'System',
  'Administrator',
  'System Administrator',
  'ADMIN',
  true,
  false,
  false,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
`);

console.log('\nThen try logging in with:');
console.log('Email/Username: admin');
console.log('Password: password');
