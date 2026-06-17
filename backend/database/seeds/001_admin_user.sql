-- Seed: default admin user
-- Generate bcrypt hash first:
-- node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin@123',10))"
-- Then replace the hash below.

INSERT INTO users (email, password, full_name, role)
VALUES (
  'admin@algoforce.ai',
  '$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH_HERE_xxxxxxxxxxxxxxxxxxxxx',
  'AlgoForce Admin',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
