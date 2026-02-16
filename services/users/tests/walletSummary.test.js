const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');
const walletClient = require('../src/services/walletClient');

let token;
let userId;

beforeAll(async () => {
  await migrate();
  await pool.query('DELETE FROM users');

  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'WalletUser', email: 'wallet-test@test.com', password: 'secret123' });

  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users');
  await pool.end();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /me/wallet-summary', () => {
  it('returns balance and recent transactions on success', async () => {
    jest.spyOn(walletClient, 'getBalance').mockResolvedValue({
      userId,
      balance: 4200,
      currency: 'USD',
    });

    jest.spyOn(walletClient, 'getTransactions').mockResolvedValue({
      data: [
        { id: 'tx-1', type: 'credit', amount: 5000, currency: 'USD', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'tx-2', type: 'debit', amount: 800, currency: 'USD', createdAt: '2026-01-02T00:00:00Z' },
      ],
      total: 2,
      limit: 5,
      offset: 0,
    });

    const res = await request(app)
      .get('/me/wallet-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(res.body.balance).toBe(4200);
    expect(res.body.currency).toBe('USD');
    expect(res.body.recentTransactions).toHaveLength(2);
    expect(walletClient.getBalance).toHaveBeenCalledWith(userId);
    expect(walletClient.getTransactions).toHaveBeenCalledWith(userId, 5);
  });

  it('returns 502 when Wallet service is unreachable', async () => {
    const err = new Error('Wallet responded with 500');
    err.status = 502;
    err.expose = true;

    jest.spyOn(walletClient, 'getBalance').mockRejectedValue(err);
    jest.spyOn(walletClient, 'getTransactions').mockRejectedValue(err);

    const res = await request(app)
      .get('/me/wallet-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(502);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/me/wallet-summary');
    expect(res.status).toBe(401);
  });
});
