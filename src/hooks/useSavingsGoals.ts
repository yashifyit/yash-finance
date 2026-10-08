import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { applyGoalChange } from '@/lib/goals';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  is_completed: boolean;
}

export function useSavingsGoals() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savings_goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'current_amount' | 'is_completed'>) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: userId, device_id: userId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals', userId] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsGoal> & { id: string }) => {
      const goal = goals.find(g => g.id === id);
      if (goal && (updates.target_amount !== undefined || updates.current_amount !== undefined)) {
        const target = updates.target_amount ?? goal.target_amount;
        const current = updates.current_amount ?? goal.current_amount;
        updates.is_completed = Number(current) >= Number(target);
      }
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals', userId] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals', userId] });
    },
  });

  const addToGoal = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Goal not found');
      if (amount < 0 && -amount > Number(goal.current_amount)) {
        throw new Error('Cannot withdraw more than saved');
      }
      const change = applyGoalChange(goal.current_amount, goal.target_amount, amount);
      
      const { data, error } = await supabase
        .from('savings_goals')
        .update(change)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals', userId] });
    },
  });

  return {
    goals,
    isLoading,
    addGoal: addGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    addToGoal: addToGoal.mutate,
    isAdding: addGoal.isPending,
    isUpdating: updateGoal.isPending,
  };
}
