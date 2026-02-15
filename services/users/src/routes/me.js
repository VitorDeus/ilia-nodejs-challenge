const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const ctrl = require('../controllers/userController');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.me);
router.get('/wallet-summary', ctrl.walletSummary);

module.exports = router;
