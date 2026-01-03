import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './useDeviceId';

export interface Settings {
  id: string;
  device_id: string;
  currency: string;
  currency_symbol: string;
  monthly_budget: number;
  dark_mode: boolean;
}

export function useSettings() {
  const queryClient = useQueryClient();
  const deviceId = getDeviceId();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('settings')
          .insert({ device_id: deviceId })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as Settings;
      }
      
      return data as Settings;
    },
    enabled: !!deviceId,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('device_id', deviceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', deviceId] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
