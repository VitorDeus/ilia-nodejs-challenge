/**
 * Integration tests for the Wallet service.
 *
 * Uses an in-process Express app with a real PostgreSQL database.
 * Requires the wallet-db to be running (docker compose up wallet-db).
 *
 * Environment variables DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * and JWT_SECRET must be set (or defaults will be used).
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

const SECRET = process.env.JWT_SECRET || 'change_me';

function makeToken(sub = 'user-1') {
  return jwt.sign({ sub }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

beforeAll(async () => {
  await migrate();
  // Clean slate
  await pool.query('DELETE FROM transactions');
});

afterAll(async () => {
  await pool.query('DELETE FROM transactions');
  await pool.end();
});

// ─── AUTH ───────────────────────────────────────────────────────────────────────

describe('Authentication', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/balance');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authorization/i);
  });

  it('rejects invalid tokens', async () => {
    const res = await request(app)
      .get('/balance')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ─── POST /transactions ────────────────────────────────────────────────────────

describe('POST /transactions', () => {
  const token = makeToken('user-tx');

  it('creates a credit transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 5000 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId: 'user-tx',
      type: 'credit',
      amount: 5000,
      currency: 'USD',
    });
    expect(res.body.id).toBeDefined();
  });

  it('creates a debit transaction when balance is sufficient', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'debit', amount: 2000 });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('debit');
  });

  it('rejects a debit that would make balance negative (422)', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'debit', amount: 999999 });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Insufficient/i);
  });

  it('rejects invalid payload (missing type)', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation/i);
  });

  it('rejects zero or negative amount', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: -10 });

    expect(res.status).toBe(400);
  });
});

// ─── IDEMPOTENCY ────────────────────────────────────────────────────────────────

describe('Idempotency', () => {
  const token = makeToken('user-idem');

  it('returns the same transaction for duplicate Idempotency-Key', async () => {
    // First: credit so balance exists
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 10000 });

    const key = 'unique-key-123';
    const first = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ type: 'debit', amount: 500 });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ type: 'debit', amount: 500 });

    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
  });
});

// ─── GET /transactions ─────────────────────────────────────────────────────────

describe('GET /transactions', () => {
  const token = makeToken('user-list');

  beforeAll(async () => {
    // Seed some data
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'credit', amount: 1000 + i });
    }
  });

  it('returns paginated transactions', async () => {
    const res = await request(app)
      .get('/transactions?limit=2&offset=0')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it('filters by type', async () => {
    const res = await request(app)
      .get('/transactions?type=credit')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((tx) => expect(tx.type).toBe('credit'));
  });
});

// ─── GET /balance ───────────────────────────────────────────────────────────────

describe('GET /balance', () => {
  it('returns the derived balance', async () => {
    const token = makeToken('user-bal');
    // Credit 3000
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 3000 });
    // Debit 1000
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'debit', amount: 1000 });

    const res = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(2000);
    expect(res.body.currency).toBe('USD');
  });
});

// ─── HEALTH ─────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
