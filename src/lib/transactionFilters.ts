export type TransactionTypeFilter = 'all' | 'income' | 'expense';

export interface FilterableTransaction {
  type: 'income' | 'expense';
  category_id: string | null;
  note: string | null;
  categories?: { name?: string | null } | null;
}

export interface TransactionFilterOptions {
  /** Free-text matched against the note and the category name. */
  search: string;
  type: TransactionTypeFilter;
  /** A category id, or 'all' to keep every category. */
  categoryId: string;
}

/**
 * Keeps only the transactions matching the search text, the type filter and the
 * category filter. Pure: the input array is never mutated.
 */
export function filterTransactions<T extends FilterableTransaction>(
  transactions: T[],
  { search, type, categoryId }: TransactionFilterOptions
): T[] {
  const query = search.trim().toLowerCase();

  return transactions.filter((t) => {
    if (type !== 'all' && t.type !== type) return false;
    if (categoryId !== 'all' && (t.category_id || 'uncategorized') !== categoryId) return false;
    if (query) {
      const haystack = `${t.note ?? ''} ${t.categories?.name ?? 'uncategorized'}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
