const userService = require('../services/userService');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.validated;
    const result = await userService.register({ name, email, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const result = await userService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
