import BalanceCard from "@/components/BalanceCard";
import TransactionList from "@/components/TransactionList";
import CreateTransactionForm from "@/components/CreateTransactionForm";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <BalanceCard />
      <CreateTransactionForm />
      <TransactionList />
    </div>
  );
}
