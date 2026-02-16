import { useTranslation } from "react-i18next";
import { useBalance } from "@/hooks/useWallet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BalanceCard() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useBalance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("dashboard.failedBalance")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.balance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold tabular-nums" data-testid="balance-value">
          {data?.currency ?? "USD"}{" "}
          {(data?.balance ?? 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
      </CardContent>
    </Card>
  );
}
