import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { SpendingDonut } from '@/components/SpendingDonut';
import { TransactionList } from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { transactions, isLoading, totals } = useTransactions(selectedMonth);
  const { categories } = useCategories();
  const { settings } = useSettings();
  const currencySymbol = settings?.currency_symbol || '₹';

  // Calculate category budget usage
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catId = t.category_id || 'uncategorized';
      acc[catId] = (acc[catId] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoriesWithSpending = categories.map(cat => ({
    ...cat,
    spent: categorySpending[cat.id] || 0,
    percentage: cat.budget_limit 
      ? ((categorySpending[cat.id] || 0) / Number(cat.budget_limit)) * 100 
      : 0,
  })).sort((a, b) => b.spent - a.spent);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
          >
            <ChevronRight className={cn(
              'h-5 w-5',
              format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM') && 'opacity-30'
            )} />
          </button>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Donut Chart */}
        <section className="bg-card rounded-2xl shadow-premium p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">Spending by Category</h2>
          <SpendingDonut />
        </section>

        {/* Category Budget Progress */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Category Breakdown</h2>
          <div className="space-y-3">
            {categoriesWithSpending.slice(0, 6).map((category) => (
              <div 
                key={category.id}
                className="bg-card rounded-2xl p-4 shadow-premium"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {currencySymbol}{category.spent.toLocaleString('en-IN')}
                  </span>
                </div>
                {category.budget_limit && (
                  <>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          category.percentage > 100 ? 'bg-destructive' : 'bg-foreground'
                        )}
                        style={{ 
                          width: `${Math.min(category.percentage, 100)}%`,
                          backgroundColor: category.percentage > 100 ? undefined : category.color || undefined
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.percentage.toFixed(0)}% of {currencySymbol}{Number(category.budget_limit).toLocaleString('en-IN')} budget
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* All Transactions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">All Transactions</h2>
          <div className="bg-card rounded-2xl shadow-premium overflow-hidden">
            <TransactionList
              transactions={transactions}
              isLoading={isLoading}
              showDate
            />
          </div>
        </section>
      </main>

      <BottomNav onAddClick={() => setShowAddSheet(true)} />
      <AddTransactionSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </div>
  );
}
