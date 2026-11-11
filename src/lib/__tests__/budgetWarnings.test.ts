// @ts-ignore -- bun's built-in test runner has no type declarations in this project
import { expect, test } from 'bun:test';
import { calculateExpenseBudgetWarnings } from '../budgetWarnings';

const transactions = [
  { id: 'existing', type: 'expense' as const, amount: 80, category_id: 'food' },
  { id: 'income', type: 'income' as const, amount: 500, category_id: 'food' },
];

test('warns with the remaining amount when a category budget is exceeded', () => {
  expect(calculateExpenseBudgetWarnings({
    transactions,
    amount: 30,
    categoryId: 'food',
    categoryBudgetLimit: 100,
    monthlyBudgetLimit: null,
  })).toEqual([{ type: 'category', remaining: -10 }]);
});

test('warns when a transaction exceeds the monthly budget', () => {
  expect(calculateExpenseBudgetWarnings({
    transactions,
    amount: 30,
    categoryId: 'other',
    categoryBudgetLimit: null,
    monthlyBudgetLimit: 100,
  })).toEqual([{ type: 'monthly', remaining: -10 }]);
});

test('does not warn when an edit stays within budget after excluding itself', () => {
  expect(calculateExpenseBudgetWarnings({
    transactions: [{ id: 'editing', type: 'expense', amount: 100, category_id: 'food' }],
    amount: 90,
    categoryId: 'food',
    categoryBudgetLimit: 100,
    monthlyBudgetLimit: 100,
    excludeTransactionId: 'editing',
  })).toEqual([]);
});

test('does not warn for nonpositive or invalid amounts', () => {
  for (const amount of [0, -1, Number.NaN]) {
    expect(calculateExpenseBudgetWarnings({
      transactions: [],
      amount,
      categoryId: 'food',
      categoryBudgetLimit: 100,
      monthlyBudgetLimit: 100,
    })).toEqual([]);
  }
});