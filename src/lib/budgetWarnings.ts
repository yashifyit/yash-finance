export interface BudgetTransaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category_id: string | null;
}

export interface BudgetWarning {
  type: 'category' | 'monthly';
  remaining: number;
}

interface CalculateExpenseBudgetWarningsOptions {
  transactions: BudgetTransaction[];
  amount: number;
  categoryId: string | null;
  categoryBudgetLimit: number | null;
  monthlyBudgetLimit: number | null;
  excludeTransactionId?: string;
}

export function calculateExpenseBudgetWarnings({
  transactions,
  amount,
  categoryId,
  categoryBudgetLimit,
  monthlyBudgetLimit,
  excludeTransactionId,
}: CalculateExpenseBudgetWarningsOptions): BudgetWarning[] {
  if (!Number.isFinite(amount) || amount <= 0) return [];

  const existingExpenses = transactions.filter(
    (transaction) => transaction.type === 'expense' && transaction.id !== excludeTransactionId,
  );
  const projectedMonthlyTotal = existingExpenses.reduce(
    (total, transaction) => total + Number(transaction.amount),
    amount,
  );
  const warnings: BudgetWarning[] = [];

  if (monthlyBudgetLimit != null && monthlyBudgetLimit > 0 && projectedMonthlyTotal > monthlyBudgetLimit) {
    warnings.push({ type: 'monthly', remaining: monthlyBudgetLimit - projectedMonthlyTotal });
  }

  if (categoryId && categoryBudgetLimit != null && categoryBudgetLimit > 0) {
    const categoryTotal = existingExpenses
      .filter((transaction) => transaction.category_id === categoryId)
      .reduce((total, transaction) => total + Number(transaction.amount), amount);

    if (categoryTotal > categoryBudgetLimit) {
      warnings.push({ type: 'category', remaining: categoryBudgetLimit - categoryTotal });
    }
  }

  return warnings;
}