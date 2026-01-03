import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Receipt, 
  Film, 
  Heart, 
  Home, 
  Smartphone, 
  GraduationCap, 
  Plane, 
  Gift, 
  Dumbbell,
  Coffee,
  Briefcase,
  Wallet,
  TrendingUp,
  Building,
  CreditCard,
  type LucideIcon
} from 'lucide-react';

export interface CategoryIcon {
  name: string;
  icon: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIcon[] = [
  { name: 'utensils', icon: Utensils },
  { name: 'car', icon: Car },
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'receipt', icon: Receipt },
  { name: 'film', icon: Film },
  { name: 'heart', icon: Heart },
  { name: 'home', icon: Home },
  { name: 'smartphone', icon: Smartphone },
  { name: 'graduation-cap', icon: GraduationCap },
  { name: 'plane', icon: Plane },
  { name: 'gift', icon: Gift },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'coffee', icon: Coffee },
  { name: 'briefcase', icon: Briefcase },
  { name: 'wallet', icon: Wallet },
  { name: 'trending-up', icon: TrendingUp },
  { name: 'building', icon: Building },
  { name: 'credit-card', icon: CreditCard },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'utensils', color: '#EF4444' },
  { name: 'Transport', icon: 'car', color: '#F59E0B' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#8B5CF6' },
  { name: 'Bills', icon: 'receipt', color: '#3B82F6' },
  { name: 'Entertainment', icon: 'film', color: '#EC4899' },
  { name: 'Health', icon: 'heart', color: '#10B981' },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function getIconComponent(iconName: string): LucideIcon {
  const found = CATEGORY_ICONS.find(c => c.name === iconName);
  return found?.icon || Receipt;
}
