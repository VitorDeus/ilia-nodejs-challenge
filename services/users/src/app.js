const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');

const app = express();

app.use(express.json());

// Health check (no auth)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/auth', authRouter);
app.use('/me', meRouter);

// Global error handler
app.use(errorHandler);

module.exports = app;
