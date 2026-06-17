import { LoginSchema, RefreshTokenSchema } from '../../src/utils/validators';

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse({ email: 'user@example.com', password: 'secret123' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(LoginSchema.safeParse({ email: 'bad', password: 'secret123' }).success).toBe(false);
  });
  it('rejects short password', () => {
    expect(LoginSchema.safeParse({ email: 'user@example.com', password: '123' }).success).toBe(false);
  });
  it('rejects empty body', () => {
    expect(LoginSchema.safeParse({}).success).toBe(false);
  });
});

describe('RefreshTokenSchema', () => {
  it('accepts a refresh token', () => {
    expect(RefreshTokenSchema.safeParse({ refreshToken: 'some.jwt.token' }).success).toBe(true);
  });
  it('rejects empty token', () => {
    expect(RefreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
  });
});

describe('JWT signing and verification', () => {
  const jwt = require('jsonwebtoken');
  const secret = process.env['JWT_SECRET']!;

  it('signs and verifies an access token', () => {
    const payload = { userId: 'abc', email: 'user@example.com', role: 'member', type: 'access' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.userId).toBe('abc');
    expect(decoded.type).toBe('access');
  });

  it('signs and verifies a refresh token', () => {
    const payload = { userId: 'abc', email: 'user@example.com', role: 'member', type: 'refresh' };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.type).toBe('refresh');
  });

  it('throws on invalid token', () => {
    expect(() => jwt.verify('bad.token.here', secret)).toThrow();
  });

  it('throws TokenExpiredError on expired token', () => {
    const token = jwt.sign({ userId: 'x', type: 'access' }, secret, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, secret)).toThrow(jwt.TokenExpiredError);
  });
});
