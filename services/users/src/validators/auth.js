const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { registerSchema, loginSchema, validate };
