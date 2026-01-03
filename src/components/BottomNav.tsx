import { Link, useLocation } from 'react-router-dom';
import { Home, PieChart, FileText, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddClick: () => void;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/analytics', icon: PieChart, label: 'Analytics' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ onAddClick }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom">
      <div className="glass rounded-2xl mx-auto max-w-md mb-2 shadow-premium">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Add Button */}
          <button
            onClick={onAddClick}
            className="relative -mt-8 flex items-center justify-center"
          >
            <div className="h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
              <Plus className="h-6 w-6" />
            </div>
          </button>

          {navItems.slice(2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
