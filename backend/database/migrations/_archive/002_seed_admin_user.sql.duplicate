-- ============================================================
-- AlgoForce AI — Seed an admin user for initial login
-- Replace the password hash with a bcrypt hash of your password.
-- Generate one at: https://bcrypt-generator.com (use 10 rounds)
-- Or run: node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',10))"
-- ============================================================

INSERT INTO users (email, password, full_name, role)
VALUES (
  'admin@algoforce.ai',
  '$2a$10$placeholder_replace_with_real_bcrypt_hash',
  'AlgoForce Admin',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
