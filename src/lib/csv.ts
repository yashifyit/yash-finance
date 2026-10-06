export interface CsvTransaction {
  date: string;
  type: string;
  amount: number;
  note: string | null;
  categories?: { name: string } | null;
}

/** Escape one CSV cell: neutralise formula injection, quote and escape quotes. */
export function escapeCsvField(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Pure: builds CSV text from transactions. */
export function buildTransactionsCsv(transactions: CsvTransaction[]): string {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.categories?.name || 'Uncategorized',
    t.amount,
    t.note || '',
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}
