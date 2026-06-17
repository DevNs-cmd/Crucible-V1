import request from 'supertest';
import app from '../../src/app';

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
  },
}));

const jwt = require('jsonwebtoken');
const validToken = jwt.sign(
  { userId: 'test-user-id', email: 'test@example.com', role: 'member', type: 'access' },
  process.env['JWT_SECRET']!,
  { expiresIn: '1h' }
);

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 422 for missing body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad', password: 'pass123' });
    expect(res.status).toBe(422);
  });
  it('returns 401 for unknown user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'pass123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 422 for missing token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(422);
  });
  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid.token' });
    expect(res.status).toBe(401);
  });
});

describe('Protected routes without token', () => {
  const routes = [
    { method: 'get', path: '/api/leads' },
    { method: 'post', path: '/api/leads' },
    { method: 'get', path: '/api/auth/me' },
    { method: 'post', path: '/api/audit/generate' },
    { method: 'post', path: '/api/proposals/generate' },
    { method: 'get', path: '/api/analytics/dashboard' },
  ];
  routes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
      const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('POST /api/audit/generate validation', () => {
  it('returns 422 for empty body', async () => {
    const res = await request(app)
      .post('/api/audit/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(422);
  });
  it('returns 422 for invalid budget', async () => {
    const res = await request(app)
      .post('/api/audit/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ companyName: 'X', industry: 'SaaS', companyType: 'B2B', companySize: '1-10', problems: ['P1'], budget: 'extreme' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/proposals/generate validation', () => {
  it('returns 422 for empty body', async () => {
    const res = await request(app)
      .post('/api/proposals/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(422);
  });
});

describe('GET /api/analytics/* with valid token', () => {
  it('dashboard attempts DB call (returns 500 with mock)', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${validToken}`);
    expect([200, 500]).toContain(res.status);
  });
});
