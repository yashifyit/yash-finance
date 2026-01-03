import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Settings {
  id: string;
  user_id: string;
  currency: string;
  currency_symbol: string;
  monthly_budget: number;
  dark_mode: boolean;
  user_name: string | null;
  user_age: number | null;
  user_occupation: string | null;
}

export function useSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('settings')
          .insert({ user_id: userId, device_id: userId } as any)
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as Settings;
      }
      
      return data as Settings;
    },
    enabled: !!userId,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
