const service = require('../services/transactionService');

async function create(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || null;
    const { type, amount, currency, description } = req.validated;

    const { transaction, created } = await service.createTransaction({
      userId: req.user.id,
      type,
      amount,
      currency,
      description,
      idempotencyKey,
    });

    res.status(created ? 201 : 200).json(transaction);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { limit, offset, type, start_date: startDate, end_date: endDate } = req.query;
    const result = await service.listTransactions(req.user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      type,
      startDate,
      endDate,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function balance(req, res, next) {
  try {
    const result = await service.getBalance(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, balance };
