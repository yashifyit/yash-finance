import { filterTransactions } from '../transactionFilters';
// @ts-ignore -- bun's built-in test runner has no type declarations in this project
import { expect, test } from 'bun:test';

const rows = [
  { id: 'a', type: 'expense' as const, amount: 450, category_id: 'food', note: 'Coffee with Sam', categories: { name: 'Food & Dining' } },
  { id: 'b', type: 'expense' as const, amount: 1200, category_id: 'transport', note: 'Uber to airport', categories: { name: 'Transport' } },
  { id: 'c', type: 'income' as const, amount: 50000, category_id: null, note: 'Monthly salary', categories: null },
];
const ids = (list: { id: string }[]) => list.map(r => r.id);
const none = { search: '', type: 'all' as const, categoryId: 'all' };

test('no filters keep everything', () => expect(ids(filterTransactions(rows, none))).toEqual(['a', 'b', 'c']));
test('income only', () => expect(ids(filterTransactions(rows, { ...none, type: 'income' }))).toEqual(['c']));
test('expense only', () => expect(ids(filterTransactions(rows, { ...none, type: 'expense' }))).toEqual(['a', 'b']));
test('category filter', () => expect(ids(filterTransactions(rows, { ...none, categoryId: 'transport' }))).toEqual(['b']));
test('category filter drops uncategorized', () => expect(ids(filterTransactions(rows, { ...none, categoryId: 'food' }))).toEqual(['a']));
test('search matches note', () => expect(ids(filterTransactions(rows, { ...none, search: 'coffee' }))).toEqual(['a']));
test('search matches category name', () => expect(ids(filterTransactions(rows, { ...none, search: 'trans' }))).toEqual(['b']));
test('search ignores case and surrounding spaces', () => expect(ids(filterTransactions(rows, { ...none, search: '  MONTHLY  ' }))).toEqual(['c']));
test('all three filters combine', () => expect(ids(filterTransactions(rows, { search: 'o', type: 'expense', categoryId: 'food' }))).toEqual(['a']));
test('nothing matches an unknown word', () => expect(filterTransactions(rows, { ...none, search: 'zzz' })).toEqual([]));
test('input array is not mutated', () => {
  filterTransactions(rows, { search: 'coffee', type: 'expense', categoryId: 'all' });
  expect(rows.length).toBe(3);
});
