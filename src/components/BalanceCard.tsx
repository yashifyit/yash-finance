import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function BalanceCard() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { balance, totals, isLoading: transactionsLoading } = useTransactions();

  const isLoading = settingsLoading || transactionsLoading;
  const currencySymbol = settings?.currency_symbol || '₹';
  const monthlyBudget = settings?.monthly_budget || 50000;
  const budgetUsed = (totals.expenses / monthlyBudget) * 100;

  if (isLoading) {
    return (
      <div className="card-gradient shadow-premium rounded-2xl p-6 space-y-6">
        <div className="skeleton-loader h-8 w-32" />
        <div className="skeleton-loader h-12 w-48" />
        <div className="skeleton-loader h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <div className="skeleton-loader h-16 w-28" />
          <div className="skeleton-loader h-16 w-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-gradient shadow-premium rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Total Balance
        </span>
        <span className="text-xs text-muted-foreground">
          This Month
        </span>
      </div>

      {/* Balance */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {currencySymbol}{balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </h1>
      </div>

      {/* Budget Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly Budget</span>
          <span className={cn(
            'font-medium',
            budgetUsed > 100 ? 'text-destructive' : 'text-foreground'
          )}>
            {budgetUsed.toFixed(0)}% used
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              budgetUsed > 100 ? 'bg-destructive' : budgetUsed > 80 ? 'bg-amber-500' : 'bg-foreground'
            )}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currencySymbol}{totals.expenses.toLocaleString('en-IN')}</span>
          <span>{currencySymbol}{monthlyBudget.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Income & Expenses */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Income</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {currencySymbol}{totals.income.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-destructive">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Expenses</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {currencySymbol}{totals.expenses.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
