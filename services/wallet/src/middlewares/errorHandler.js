/**
 * Global error handler — returns consistent JSON format.
 * Never exposes stack traces unless NODE_ENV === 'development'.
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
