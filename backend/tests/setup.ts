// Load test environment variables before any test file
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '4001';
process.env['SUPABASE_URL'] = 'https://test.supabase.co';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key-for-jest-only';
process.env['JWT_SECRET'] = 'test-jwt-secret-that-is-at-least-32-chars-long';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test-key-for-jest-only';
process.env['N8N_WEBHOOK_NEW_LEAD'] = 'https://n8n.test/webhook/new-lead';
process.env['N8N_WEBHOOK_STATUS_CHANGE'] = 'https://n8n.test/webhook/status-change';
process.env['N8N_WEBHOOK_FOLLOWUP_REMINDER'] = 'https://n8n.test/webhook/followup-reminder';
process.env['SMTP_HOST'] = 'smtp.test.com';
process.env['SMTP_PORT'] = '587';
process.env['SMTP_USER'] = 'test@test.com';
process.env['SMTP_PASS'] = 'test-smtp-pass';
process.env['SMTP_FROM'] = 'AlgoForce Test <test@test.com>';
process.env['ENABLE_CRON'] = 'false';
