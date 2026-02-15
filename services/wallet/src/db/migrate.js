const pool = require('./pool');

const UP = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(255)   NOT NULL,
  type          VARCHAR(10)    NOT NULL CHECK (type IN ('credit', 'debit')),
  amount        INTEGER        NOT NULL CHECK (amount > 0),
  currency      VARCHAR(10)    NOT NULL DEFAULT 'USD',
  description   TEXT,
  idempotency_key VARCHAR(255),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency
  ON transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON transactions (type);
`;

async function migrate() {
  console.log('[migrate] running migrations …');
  await pool.query(UP);
  console.log('[migrate] done');
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  const { Pool: P } = require('pg');
  const cfg = require('../config');
  const p = new P(cfg.db);
  p.query(UP)
    .then(() => { console.log('[migrate] done'); process.exit(0); })
    .catch((err) => { console.error('[migrate] failed', err); process.exit(1); });
} else {
  module.exports = migrate;
}
