import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './useDeviceId';

export interface RecurringTransaction {
  id: string;
  device_id: string;
  type: 'expense' | 'income';
  amount: number;
  category_id: string | null;
  note: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  next_due_date: string;
  is_active: boolean;
  last_processed_date: string | null;
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
  const deviceId = getDeviceId();

  const { data: recurringTransactions = [], isLoading } = useQuery({
    queryKey: ['recurring_transactions', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      
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
        .eq('device_id', deviceId)
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      return data as RecurringTransactionWithCategory[];
    },
    enabled: !!deviceId,
  });

  const addRecurring = useMutation({
    mutationFn: async (transaction: Omit<RecurringTransaction, 'id' | 'device_id' | 'last_processed_date'>) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({ ...transaction, device_id: deviceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', deviceId] });
    },
  });

  const updateRecurring = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .eq('device_id', deviceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', deviceId] });
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('device_id', deviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', deviceId] });
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
