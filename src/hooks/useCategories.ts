import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string | null;
  budget_limit: number | null;
  is_default: boolean;
}

export function useCategories() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Create default categories if none exist
      if (data.length === 0) {
        const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          user_id: userId,
          device_id: userId,
          is_default: true,
        }));
        
        const { data: newCategories, error: insertError } = await supabase
          .from('categories')
          .insert(defaultCats as any)
          .select();
        
        if (insertError) throw insertError;
        return (newCategories || []) as Category[];
      }
      
      return data as Category[];
    },
    enabled: !!userId,
  });

  const addCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'user_id' | 'is_default'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: userId, device_id: userId } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  return {
    categories,
    isLoading,
    addCategory: addCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isAdding: addCategory.isPending,
  };
}
