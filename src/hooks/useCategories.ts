import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './useDeviceId';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export interface Category {
  id: string;
  device_id: string;
  name: string;
  icon: string;
  color: string | null;
  budget_limit: number | null;
  is_default: boolean;
}

export function useCategories() {
  const queryClient = useQueryClient();
  const deviceId = getDeviceId();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Create default categories if none exist
      if (data.length === 0) {
        const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          device_id: deviceId,
          is_default: true,
        }));
        
        const { data: newCategories, error: insertError } = await supabase
          .from('categories')
          .insert(defaultCats)
          .select();
        
        if (insertError) throw insertError;
        return (newCategories || []) as Category[];
      }
      
      return data as Category[];
    },
    enabled: !!deviceId,
  });

  const addCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'device_id' | 'is_default'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, device_id: deviceId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', deviceId] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('device_id', deviceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', deviceId] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('device_id', deviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', deviceId] });
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
