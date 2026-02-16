import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const transactionSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive("Amount must be positive"),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
