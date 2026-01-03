import { useState } from 'react';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionList } from '@/components/TransactionList';
import { BottomNav } from '@/components/BottomNav';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { useTransactions } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { transactions, isLoading } = useTransactions();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4">
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE')}</p>
            <h1 className="text-2xl font-bold text-foreground">{format(new Date(), 'MMMM d')}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        {/* Balance Card */}
        <BalanceCard />

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
            <Link 
              to="/analytics" 
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl shadow-premium overflow-hidden">
            <TransactionList
              transactions={transactions}
              isLoading={isLoading}
              limit={5}
              showDate
            />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowAddSheet(true)} />

      {/* Add Transaction Sheet */}
      <AddTransactionSheet 
        open={showAddSheet} 
        onOpenChange={setShowAddSheet} 
      />
    </div>
  );
}
