import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'expense' | 'income';
  amount: number;
  category_id: string | null;
  note: string | null;
  date: string;
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  categories: {
    id: string;
    name: string;
    icon: string;
    color: string | null;
  } | null;
}

export function useTransactions(month?: Date) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const targetMonth = month || new Date();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', userId, format(targetMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!userId) return [];
      
      const start = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(targetMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TransactionWithCategory[];
    },
    enabled: !!userId,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: userId, device_id: userId } as any)
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'income') {
        acc.income += amount;
      } else {
        acc.expenses += amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  return {
    transactions,
    isLoading,
    totals,
    balance: totals.income - totals.expenses,
    addTransaction: addTransaction.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isAdding: addTransaction.isPending,
  };
}
