const { Router } = require('express');
const ctrl = require('../controllers/transactionController');
const authenticate = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');
const { validate, createTransactionSchema } = require('../validators/transaction');

const router = Router();

// All routes require JWT
router.use(authenticate);

// POST /transactions — rate-limited
router.post('/', rateLimiter, validate(createTransactionSchema), ctrl.create);

// GET /transactions
router.get('/', ctrl.list);

// GET /balance
router.get('/balance', ctrl.balance);

module.exports = router;
