const { Router } = require('express');
const ctrl = require('../controllers/transactionController');
const authenticate = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');
const { validate, createTransactionSchema } = require('../validators/transaction');

const router = Router();

router.use(authenticate);

router.post('/', rateLimiter, validate(createTransactionSchema), ctrl.create);

router.get('/', ctrl.list);

router.get('/balance', ctrl.balance);

module.exports = router;
