process.env.RATE_LIMIT_MAX = '3';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

const SECRET = process.env.JWT_SECRET || 'change_me';

function makeToken(sub = 'user-rate') {
  return jwt.sign({ sub }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await pool.query('DELETE FROM transactions WHERE user_id = $1', ['user-rate']);
  await pool.end();
});

describe('Rate limiting on POST /transactions', () => {
  const token = makeToken();

  it('returns 429 after exceeding RATE_LIMIT_MAX', async () => {
    const results = [];

    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'credit', amount: 100 });
      results.push(res.status);
    }

    expect(results.slice(0, 3).every((s) => s === 201)).toBe(true);
    expect(results[3]).toBe(429);
  });

  it('returns standardized error body on 429', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 100 });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'Too many requests, please try again later' });
  });
});
