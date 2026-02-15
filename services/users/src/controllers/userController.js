const userService = require('../services/userService');
const walletClient = require('../services/walletClient');

async function me(req, res, next) {
  try {
    const user = await userService.getById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function walletSummary(req, res, next) {
  try {
    const [balance, transactions] = await Promise.all([
      walletClient.getBalance(req.user.id),
      walletClient.getTransactions(req.user.id, 5),
    ]);

    res.json({
      userId: req.user.id,
      balance: balance.balance,
      currency: balance.currency,
      recentTransactions: transactions.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { me, walletSummary };
