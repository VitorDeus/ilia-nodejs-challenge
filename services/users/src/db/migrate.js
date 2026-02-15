const pool = require('./pool');

const UP = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255)   NOT NULL,
  email         VARCHAR(255)   NOT NULL UNIQUE,
  password_hash VARCHAR(255)   NOT NULL,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
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
