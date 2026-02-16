export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  currency: string;
  description: string | null;
  createdAt: string;
}

export interface Balance {
  userId: string;
  balance: number;
  currency: string;
}

export interface WalletSummary {
  balance: Balance;
  transactions: Transaction[];
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
}
