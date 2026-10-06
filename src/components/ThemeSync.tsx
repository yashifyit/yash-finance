import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

const KEY = 'balancio-dark-mode';

function SettingsThemeSync() {
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading) return;
    const saved = settings?.dark_mode;
    const dark =
      typeof saved === 'boolean'
        ? saved
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    if (typeof saved === 'boolean') localStorage.setItem(KEY, String(saved));
    else localStorage.removeItem(KEY);
  }, [settings?.dark_mode, isLoading]);

  return null;
}

export function ThemeSync() {
  const { user } = useAuth();
  return user ? <SettingsThemeSync /> : null;
}
