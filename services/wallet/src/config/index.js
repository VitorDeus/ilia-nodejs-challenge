const env = process.env;

module.exports = {
  port: parseInt(env.PORT, 10) || 3001,
  db: {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT, 10) || 5432,
    database: env.DB_NAME || 'wallet',
    user: env.DB_USER || 'wallet',
    password: env.DB_PASSWORD || 'wallet',
  },
  jwtSecret: env.JWT_SECRET || 'change_me',
  internalJwtSecret: env.INTERNAL_JWT_SECRET || 'change_me_internal',
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(env.RATE_LIMIT_MAX, 10) || 30,
  },
};
