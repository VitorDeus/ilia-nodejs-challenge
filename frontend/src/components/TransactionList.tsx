import { useTranslation } from "react-i18next";
import { useTransactions } from "@/hooks/useWallet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Transaction } from "@/types";

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === "credit";
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            isCredit
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {tx.type}
        </span>
        <span className="ml-2 text-sm text-muted-foreground">
          {new Date(tx.createdAt).toLocaleString()}
        </span>
      </div>
      <span className={`font-semibold tabular-nums ${isCredit ? "text-green-700" : "text-red-700"}`}>
        {isCredit ? "+" : "-"}
        {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export default function TransactionList() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useTransactions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("dashboard.failedTransactions")}</AlertDescription>
      </Alert>
    );
  }

  const txns = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.transactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {txns.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="empty-transactions">
            {t("dashboard.noTransactions")}
          </p>
        ) : (
          <div data-testid="transaction-list">
            {txns.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
