import BalanceCard from "@/components/BalanceCard";
import TransactionList from "@/components/TransactionList";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <BalanceCard />
      <TransactionList />
    </div>
  );
}
