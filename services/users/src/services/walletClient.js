const jwt = require('jsonwebtoken');
const config = require('../config');

function createInternalToken(userId) {
  return jwt.sign(
    { sub: userId, aud: 'internal', iss: 'users-service', svc: 'users' },
    config.internalJwtSecret,
    { algorithm: 'HS256', expiresIn: '30s' },
  );
}

async function getBalance(userId) {
  const token = createInternalToken(userId);
  const res = await fetch(`${config.walletBaseUrl}/internal/balance/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Wallet responded with ${res.status}`);
    err.status = res.status >= 500 ? 502 : res.status;
    err.expose = true;
    throw err;
  }
  return res.json();
}

async function getTransactions(userId, limit = 5) {
  const token = createInternalToken(userId);
  const res = await fetch(
    `${config.walletBaseUrl}/internal/transactions/${userId}?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Wallet responded with ${res.status}`);
    err.status = res.status >= 500 ? 502 : res.status;
    err.expose = true;
    throw err;
  }
  return res.json();
}

module.exports = { getBalance, getTransactions, createInternalToken };
