import { useMemo, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { SpendingDonut } from '@/components/SpendingDonut';
import { TransactionList } from '@/components/TransactionList';
import { useTransactions, TransactionWithCategory } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterTransactions, type TransactionTypeFilter } from '@/lib/transactionFilters';

export default function AnalyticsPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
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

  const filtersActive = search.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, { search, type: typeFilter, categoryId: categoryFilter }),
    [transactions, search, typeFilter, categoryFilter]
  );

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

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
          <SpendingDonut month={selectedMonth} />
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

          {/* Search + filters */}
          <div className="space-y-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search note or category"
                aria-label="Search transactions by note or category"
                className="pl-10 pr-10 h-11 bg-card border-0 shadow-premium rounded-2xl"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger
                  aria-label="Filter by type"
                  className="h-11 bg-card border-0 shadow-premium rounded-2xl px-4"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  aria-label="Filter by category"
                  className="h-11 bg-card border-0 shadow-premium rounded-2xl px-4"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtersActive && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.length} of {transactions.length} shown
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-foreground underline underline-offset-4"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl shadow-premium overflow-hidden">
            {filtersActive && !isLoading && filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No matching transactions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search or clear the filters
                </p>
              </div>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                isLoading={isLoading}
                showDate
                onTransactionClick={(transaction) => {
                  setEditingTransaction(transaction);
                  setShowAddSheet(true);
                }}
              />
            )}
          </div>
        </section>
      </main>

      <BottomNav onAddClick={() => {
        setEditingTransaction(null);
        setShowAddSheet(true);
      }} />
      <AddTransactionSheet 
        open={showAddSheet} 
        onOpenChange={(open) => {
          setShowAddSheet(open);
          if (!open) setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
