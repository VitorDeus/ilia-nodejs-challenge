import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/axios";
import type { Balance, TransactionListResponse } from "@/types";

export function useBalance() {
  return useQuery<Balance>({
    queryKey: ["balance"],
    queryFn: async () => {
      const res = await walletApi.get("/balance");
      return res.data;
    },
  });
}

export function useTransactions(limit = 20, offset = 0) {
  return useQuery<TransactionListResponse>({
    queryKey: ["transactions", limit, offset],
    queryFn: async () => {
      const res = await walletApi.get("/transactions", {
        params: { limit, offset },
      });
      return res.data;
    },
  });
}
