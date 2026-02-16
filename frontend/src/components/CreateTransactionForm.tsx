import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "@/lib/axios";
import { transactionSchema, type TransactionFormData } from "@/lib/schemas";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateTransactionForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "credit", amount: undefined },
  });

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const res = await walletApi.post("/transactions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setFeedback({ type: "success", msg: t("transaction.created") });
      reset();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Transaction failed";
      setFeedback({ type: "error", msg });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transaction.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {feedback && (
            <Alert variant={feedback.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{feedback.msg}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="type">{t("transaction.type")}</Label>
            <Select id="type" data-testid="tx-type" {...register("type")}>
              <option value="credit">{t("transaction.credit")}</option>
              <option value="debit">{t("transaction.debit")}</option>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{t("transaction.amount")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("transaction.creating") : t("transaction.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
