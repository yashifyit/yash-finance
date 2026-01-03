import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: 'expense' | 'income';
  amount: number;
  category_id: string | null;
  note: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  next_due_date: string;
  last_processed_date: string | null;
  is_active: boolean;
}

export interface RecurringTransactionWithCategory extends RecurringTransaction {
  categories: {
    id: string;
    name: string;
    icon: string;
    color: string | null;
  } | null;
}

export function useRecurringTransactions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: recurringTransactions = [], isLoading } = useQuery({
    queryKey: ['recurring_transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('recurring_transactions')
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
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      return data as RecurringTransactionWithCategory[];
    },
    enabled: !!userId,
  });

  const addRecurring = useMutation({
    mutationFn: async (transaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'last_processed_date' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
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
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', userId] });
    },
  });

  const updateRecurring = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', userId] });
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', userId] });
    },
  });

  return {
    recurringTransactions,
    isLoading,
    addRecurring: addRecurring.mutate,
    updateRecurring: updateRecurring.mutate,
    deleteRecurring: deleteRecurring.mutate,
    isAdding: addRecurring.isPending,
  };
}
