/**
 * Integration tests for the Users service.
 *
 * Requires users-db running (docker compose up users-db).
 * Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

const SECRET = process.env.JWT_SECRET || 'change_me';

beforeAll(async () => {
  await migrate();
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.query('DELETE FROM users');
  await pool.end();
});

// ─── HEALTH ─────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─── POST /auth/register ───────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('registers a new user and returns JWT', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.token).toBeDefined();

    // Verify token decodes correctly
    const payload = jwt.verify(res.body.token, SECRET);
    expect(payload.sub).toBe(res.body.user.id);
  });

  it('rejects duplicate email (409)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice 2', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects invalid payload', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: '', email: 'bad', password: '12' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation/i);
  });
});

// ─── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password (401)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('rejects non-existent email (401)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /me ────────────────────────────────────────────────────────────────────

describe('GET /me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'secret123' });
    token = res.body.token;
  });

  it('returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@test.com');
    expect(res.body.name).toBe('Alice');
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });
});
