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
  user_id: string;
  type: "credit" | "debit";
  amount: number;
  created_at: string;
}

export interface Balance {
  user_id: string;
  balance: number;
  currency: string;
}

export interface WalletSummary {
  balance: Balance;
  transactions: Transaction[];
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export interface ApiError {
  error: string;
}
