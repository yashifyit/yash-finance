import { z } from 'zod';

// Transaction validation
export const transactionSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000000, 'Amount must be less than 10,000,000')
    .finite('Amount must be a valid number'),
  type: z.enum(['expense', 'income']),
  note: z.string().max(500, 'Note must be less than 500 characters').nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  category_id: z.string().uuid().nullable(),
  is_recurring: z.boolean().optional(),
  recurring_id: z.string().uuid().nullable().optional(),
});

// Category validation
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  icon: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable(),
  budget_limit: z.number()
    .positive('Budget must be positive')
    .max(10000000, 'Budget must be less than 10,000,000')
    .nullable()
    .optional(),
});

// Profile validation
export const profileSchema = z.object({
  user_name: z.string().max(100, 'Name must be less than 100 characters').trim().nullable().optional(),
  user_age: z.number()
    .int('Age must be a whole number')
    .min(0, 'Age must be positive')
    .max(150, 'Invalid age')
    .nullable()
    .optional(),
  user_occupation: z.string().max(100, 'Occupation must be less than 100 characters').trim().nullable().optional(),
});

// Savings goal validation
export const savingsGoalSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  target_amount: z.number()
    .positive('Target amount must be positive')
    .max(10000000, 'Target must be less than 10,000,000'),
  current_amount: z.number()
    .min(0, 'Current amount cannot be negative')
    .max(10000000, 'Amount must be less than 10,000,000'),
  deadline: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable(),
  icon: z.string(),
  is_completed: z.boolean(),
});

// Settings validation
export const settingsSchema = z.object({
  monthly_budget: z.number()
    .min(0, 'Budget cannot be negative')
    .max(100000000, 'Budget must be less than 100,000,000')
    .optional(),
  currency: z.string().max(10).optional(),
  currency_symbol: z.string().max(5).optional(),
  dark_mode: z.boolean().optional(),
});

// Helper to validate and parse with error message
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.errors[0]?.message || 'Validation failed';
  return { success: false, error: errorMessage };
}
