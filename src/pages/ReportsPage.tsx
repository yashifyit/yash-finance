import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { totals, isLoading } = useTransactions(selectedMonth);
  const { settings } = useSettings();
  const currencySymbol = settings?.currency_symbol || '₹';
  const { user } = useAuth();
  const userId = user?.id;

  // Get previous month data for comparison
  const previousMonth = subMonths(selectedMonth, 1);
  const { data: previousTotals } = useQuery({
    queryKey: ['transactions-totals', userId, format(previousMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId!)
        .gte('date', start)
        .lte('date', end);
      
      if (error) throw error;
      
      return data.reduce(
        (acc, t) => {
          const amount = Number(t.amount);
          if (t.type === 'income') acc.income += amount;
          else acc.expenses += amount;
          return acc;
        },
        { income: 0, expenses: 0 }
      );
    },
    enabled: !!userId,
  });

  // Get last 6 months data for chart in a single query, grouped by month in code
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-chart', userId],
    queryFn: async () => {
      const now = new Date();
      const firstMonth = subMonths(now, 5);
      const start = format(startOfMonth(firstMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', userId!)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        months.push({
          key: format(month, 'yyyy-MM'),
          month: format(month, 'MMM'),
          income: 0,
          expenses: 0,
        });
      }

      for (const t of data) {
        const key = t.date.slice(0, 7);
        const bucket = months.find((m) => m.key === key);
        if (!bucket) continue;
        const amount = Number(t.amount);
        if (t.type === 'income') bucket.income += amount;
        else bucket.expenses += amount;
      }

      return months;
    },
    enabled: !!userId,
  });

  const hasPreviousData = !!previousTotals && (previousTotals.income > 0 || previousTotals.expenses > 0);

  const incomeChange = previousTotals?.income 
    ? ((totals.income - previousTotals.income) / previousTotals.income) * 100 
    : 0;
  const expenseChange = previousTotals?.expenses 
    ? ((totals.expenses - previousTotals.expenses) / previousTotals.expenses) * 100 
    : 0;

  const savingsRate = totals.income > 0 
    ? ((totals.income - totals.expenses) / totals.income) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
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
            onClick={() => setSelectedMonth(subMonths(selectedMonth, -1))}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-4 shadow-premium">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {currencySymbol}{totals.income.toLocaleString('en-IN')}
            </p>
            {hasPreviousData ? (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                incomeChange >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(incomeChange).toFixed(0)}% vs last month
              </div>
            ) : (
              <p className="text-xs mt-1 text-muted-foreground">No data last month</p>
            )}
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-premium">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {currencySymbol}{totals.expenses.toLocaleString('en-IN')}
            </p>
            {hasPreviousData ? (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                expenseChange <= 0 ? 'text-success' : 'text-destructive'
              )}>
                {expenseChange <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                {Math.abs(expenseChange).toFixed(0)}% vs last month
              </div>
            ) : (
              <p className="text-xs mt-1 text-muted-foreground">No data last month</p>
            )}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-card rounded-2xl p-5 shadow-premium">
          <h2 className="text-lg font-semibold text-foreground mb-4">Savings Rate</h2>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-foreground">
              {savingsRate.toFixed(0)}%
            </span>
            <span className="text-muted-foreground pb-1">
              {currencySymbol}{(totals.income - totals.expenses).toLocaleString('en-IN')} saved
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full mt-4 overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full transition-all',
                savingsRate < 0 ? 'bg-destructive' : 'bg-success'
              )}
              style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }}
            />
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-card rounded-2xl p-5 shadow-premium">
          <h2 className="text-lg font-semibold text-foreground mb-4">6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                {monthlyData.map((_, index) => (
                  <Cell 
                    key={`income-${index}`} 
                    fill="hsl(var(--success))"
                  />
                ))}
              </Bar>
              <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
                {monthlyData.map((_, index) => (
                  <Cell 
                    key={`expenses-${index}`} 
                    fill="hsl(var(--destructive))"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-success" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-destructive" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav onAddClick={() => setShowAddSheet(true)} />
      <AddTransactionSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </div>
  );
}
