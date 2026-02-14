const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Rate limiter keyed by JWT userId.
 * Falls back to IP when user is not yet authenticated.
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user && req.user.id) || req.ip,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  },
});

module.exports = limiter;
