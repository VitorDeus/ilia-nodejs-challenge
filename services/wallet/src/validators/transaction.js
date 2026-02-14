const { z } = require('zod');

const createTransactionSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z
    .number()
    .int('Amount must be an integer (cents)')
    .positive('Amount must be greater than zero'),
  currency: z.string().min(1).max(10).default('USD'),
  description: z.string().max(500).optional(),
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

module.exports = { createTransactionSchema, validate };
