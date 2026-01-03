import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { SkeletonDonut } from '@/components/SkeletonLoaders';

export function SpendingDonut() {
  const { transactions, isLoading: transactionsLoading, totals } = useTransactions();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { settings } = useSettings();
  
  const isLoading = transactionsLoading || categoriesLoading;
  const currencySymbol = settings?.currency_symbol || '₹';

  // Calculate spending by category
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catId = t.category_id || 'uncategorized';
      acc[catId] = (acc[catId] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(categorySpending)
    .map(([catId, amount]) => {
      const category = categories.find(c => c.id === catId);
      return {
        name: category?.name || 'Other',
        value: amount,
        color: category?.color || '#6B7280',
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (isLoading) {
    return <SkeletonDonut />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-48 w-48 rounded-full bg-muted flex items-center justify-center mb-4">
          <p className="text-muted-foreground">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Total Spent</p>
        <p className="text-2xl font-bold text-foreground">
          {currencySymbol}{totals.expenses.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 px-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground truncate">{item.name}</span>
            <span className="text-sm font-medium text-foreground ml-auto">
              {currencySymbol}{item.value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
