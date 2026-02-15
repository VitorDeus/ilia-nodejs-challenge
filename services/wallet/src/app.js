const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const transactionsRouter = require('./routes/transactions');
const internalRouter = require('./routes/internal');

const app = express();

app.use(express.json());

// Health check (no auth)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Public routes (external JWT + rate limiting)
app.use('/transactions', transactionsRouter);

// GET /balance convenience alias
app.get('/balance', require('./middlewares/authenticate'), require('./controllers/transactionController').balance);

// Internal routes (internal JWT, no rate limiting)
app.use('/internal', internalRouter);

// Global error handler
app.use(errorHandler);

module.exports = app;
