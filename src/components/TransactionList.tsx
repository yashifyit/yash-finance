import { TransactionWithCategory } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { getIconComponent } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonList } from './SkeletonLoaders';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onTransactionClick?: (transaction: TransactionWithCategory) => void;
  showDate?: boolean;
  limit?: number;
}

export function TransactionList({ 
  transactions, 
  isLoading, 
  onTransactionClick,
  showDate = true,
  limit
}: TransactionListProps) {
  const { settings } = useSettings();
  const currencySymbol = settings?.currency_symbol || '₹';

  if (isLoading) {
    return <SkeletonList count={limit || 5} />;
  }

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  if (displayTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <p className="text-muted-foreground font-medium">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Tap the + button to add your first transaction
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {displayTransactions.map((transaction) => {
        const IconComponent = getIconComponent(transaction.categories?.icon || 'receipt');
        const isExpense = transaction.type === 'expense';

        return (
          <button
            key={transaction.id}
            onClick={() => onTransactionClick?.(transaction)}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            {/* Category Icon */}
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: transaction.categories?.color 
                  ? `${transaction.categories.color}20` 
                  : 'hsl(var(--muted))' 
              }}
            >
              <IconComponent 
                className="h-5 w-5" 
                style={{ color: transaction.categories?.color || 'hsl(var(--muted-foreground))' }}
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {transaction.categories?.name || 'Uncategorized'}
              </p>
              {transaction.note && (
                <p className="text-sm text-muted-foreground truncate">
                  {transaction.note}
                </p>
              )}
              {showDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            {/* Amount */}
            <span className={cn(
              'font-semibold tabular-nums',
              isExpense ? 'text-destructive' : 'text-success'
            )}>
              {isExpense ? '-' : '+'}{currencySymbol}{Number(transaction.amount).toLocaleString('en-IN')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
