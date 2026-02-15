const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authenticates internal service-to-service requests.
 * Expects JWT signed with INTERNAL_JWT_SECRET, aud="internal".
 * The userId is taken from the URL param (not the JWT sub),
 * since the calling service acts on behalf of a user.
 */
function authenticateInternal(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.internalJwtSecret, {
      algorithms: ['HS256'],
      audience: 'internal',
    });
    req.internalCaller = {
      iss: payload.iss,
      svc: payload.svc,
      sub: payload.sub,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired internal token' });
  }
}

module.exports = authenticateInternal;
