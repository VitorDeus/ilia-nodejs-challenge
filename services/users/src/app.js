const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/me', meRouter);

app.use(errorHandler);

module.exports = app;
