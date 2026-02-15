const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const transactionsRouter = require('./routes/transactions');
const internalRouter = require('./routes/internal');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/transactions', transactionsRouter);
app.get('/balance', require('./middlewares/authenticate'), require('./controllers/transactionController').balance);
app.use('/internal', internalRouter);

app.use(errorHandler);

module.exports = app;
