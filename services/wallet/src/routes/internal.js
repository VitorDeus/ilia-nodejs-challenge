const { Router } = require('express');
const authenticateInternal = require('../middlewares/authenticateInternal');
const service = require('../services/transactionService');

const router = Router();

router.use(authenticateInternal);

router.get('/balance/:userId', async (req, res, next) => {
  try {
    const result = await service.getBalance(req.params.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/transactions/:userId', async (req, res, next) => {
  try {
    const { limit, offset, type, start_date: startDate, end_date: endDate } = req.query;
    const result = await service.listTransactions(req.params.userId, {
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
});

module.exports = router;
