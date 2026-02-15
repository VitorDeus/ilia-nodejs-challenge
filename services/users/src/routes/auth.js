const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../validators/auth');

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);

module.exports = router;
