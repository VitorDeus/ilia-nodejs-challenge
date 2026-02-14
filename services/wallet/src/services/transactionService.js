const pool = require('../db/pool');

/**
 * Create a transaction with idempotency and negative-balance protection.
 * Uses a serializable transaction for debit safety.
 */
async function createTransaction({ userId, type, amount, currency, description, idempotencyKey }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Idempotency check ---
    if (idempotencyKey) {
      const dup = await client.query(
        'SELECT * FROM transactions WHERE user_id = $1 AND idempotency_key = $2',
        [userId, idempotencyKey],
      );
      if (dup.rows.length > 0) {
        await client.query('COMMIT');
        return { transaction: formatRow(dup.rows[0]), created: false };
      }
    }

    // --- Debit balance guard ---
    if (type === 'debit') {
      const balRes = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) AS balance
         FROM transactions WHERE user_id = $1`,
        [userId],
      );
      const currentBalance = parseInt(balRes.rows[0].balance, 10);
      if (currentBalance < amount) {
        await client.query('ROLLBACK');
        const err = new Error('Insufficient balance');
        err.status = 422;
        err.expose = true;
        throw err;
      }
    }

    const result = await client.query(
      `INSERT INTO transactions (user_id, type, amount, currency, description, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, amount, currency, description || null, idempotencyKey || null],
    );

    await client.query('COMMIT');
    return { transaction: formatRow(result.rows[0]), created: true };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List transactions with pagination and optional filters.
 */
async function listTransactions(userId, { limit = 20, offset = 0, type, startDate, endDate } = {}) {
  const conditions = ['user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type) {
    conditions.push(`type = $${idx++}`);
    params.push(type);
  }
  if (startDate) {
    conditions.push(`created_at >= $${idx++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`created_at <= $${idx++}`);
    params.push(endDate);
  }

  const where = conditions.join(' AND ');
  const countRes = await pool.query(`SELECT COUNT(*) FROM transactions WHERE ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const dataRes = await pool.query(
    `SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  return { data: dataRes.rows.map(formatRow), total, limit, offset };
}

/**
 * Compute balance for a user (derived from transactions).
 */
async function getBalance(userId) {
  const res = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS total_credits,
       COALESCE(SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END), 0) AS total_debits
     FROM transactions WHERE user_id = $1`,
    [userId],
  );
  const credits = parseInt(res.rows[0].total_credits, 10);
  const debits = parseInt(res.rows[0].total_debits, 10);
  return { userId, balance: credits - debits, currency: 'USD' };
}

// --- helpers ---

function formatRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    createdAt: row.created_at,
  };
}

module.exports = { createTransaction, listTransactions, getBalance };
