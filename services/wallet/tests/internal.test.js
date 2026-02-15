const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

const EXTERNAL_SECRET = process.env.JWT_SECRET || 'change_me';
const INTERNAL_SECRET = process.env.INTERNAL_JWT_SECRET || 'change_me_internal';

function makeExternalToken(sub = 'user-internal-test') {
  return jwt.sign({ sub }, EXTERNAL_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

function makeInternalToken(sub = 'user-internal-test') {
  return jwt.sign(
    { sub, aud: 'internal', iss: 'users-service', svc: 'users' },
    INTERNAL_SECRET,
    { algorithm: 'HS256', expiresIn: '30s' },
  );
}

beforeAll(async () => {
  await migrate();
  const token = makeExternalToken();
  await request(app)
    .post('/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'credit', amount: 8000 });
  await request(app)
    .post('/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'debit', amount: 3000 });
});

afterAll(async () => {
  await pool.query("DELETE FROM transactions WHERE user_id = 'user-internal-test'");
  await pool.end();
});

describe('Internal auth', () => {
  it('rejects requests without internal token', async () => {
    const res = await request(app).get('/internal/balance/user-internal-test');
    expect(res.status).toBe(401);
  });

  it('rejects external token on internal endpoints', async () => {
    const token = makeExternalToken();
    const res = await request(app)
      .get('/internal/balance/user-internal-test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /internal/balance/:userId', () => {
  it('returns balance for a given userId', async () => {
    const token = makeInternalToken();
    const res = await request(app)
      .get('/internal/balance/user-internal-test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(5000);
    expect(res.body.currency).toBe('USD');
  });
});

describe('GET /internal/transactions/:userId', () => {
  it('returns transactions for a given userId', async () => {
    const token = makeInternalToken();
    const res = await request(app)
      .get('/internal/transactions/user-internal-test?limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.total).toBe(2);
  });
});
