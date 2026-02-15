const env = process.env;

module.exports = {
  port: parseInt(env.PORT, 10) || 3002,
  db: {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT, 10) || 5432,
    database: env.DB_NAME || 'users',
    user: env.DB_USER || 'users',
    password: env.DB_PASSWORD || 'users',
  },
  jwtSecret: env.JWT_SECRET || 'change_me',
  internalJwtSecret: env.INTERNAL_JWT_SECRET || 'change_me_internal',
  walletBaseUrl: env.WALLET_BASE_URL || 'http://localhost:3001',
};
