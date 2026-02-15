const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');

const SALT_ROUNDS = 10;

async function register({ name, email, password }) {
  // Check duplicate
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    err.expose = true;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
    [name, email, passwordHash],
  );

  const user = formatRow(result.rows[0]);
  const token = signToken(user.id);
  return { user, token };
}

async function login({ email, password }) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.expose = true;
    throw err;
  }

  const row = result.rows[0];
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.expose = true;
    throw err;
  }

  const user = formatRow(row);
  const token = signToken(user.id);
  return { user, token };
}

async function getById(id) {
  const result = await pool.query(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return formatRow(result.rows[0]);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

function formatRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  };
}

module.exports = { register, login, getById };
