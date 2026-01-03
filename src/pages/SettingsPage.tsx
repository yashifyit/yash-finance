import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSettings } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useTransactions } from '@/hooks/useTransactions';
import { CURRENCIES, getIconComponent, CATEGORY_ICONS } from '@/lib/constants';
import { Moon, Download, RefreshCw, Plus, Trash2, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserProfileSection } from '@/components/UserProfileSection';
import { SavingsGoalsSection } from '@/components/SavingsGoalsSection';

export default function SettingsPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showRecurringSheet, setShowRecurringSheet] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('receipt');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');

  const { settings, updateSettings, isLoading } = useSettings();
  const { categories, addCategory, deleteCategory, isAdding: isAddingCategory } = useCategories();
  const { recurringTransactions, deleteRecurring } = useRecurringTransactions();
  const { transactions } = useTransactions();

  // Handle dark mode toggle
  useEffect(() => {
    if (settings?.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.dark_mode]);

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast({ title: 'No transactions to export', variant: 'destructive' });
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.categories?.name || 'Uncategorized',
      t.amount.toString(),
      t.note || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Export complete' });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Please enter a category name', variant: 'destructive' });
      return;
    }

    addCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      budget_limit: newCategoryBudget ? parseFloat(newCategoryBudget) : null,
    }, {
      onSuccess: () => {
        toast({ title: 'Category added' });
        setNewCategoryName('');
        setNewCategoryBudget('');
        setShowCategorySheet(false);
      }
    });
  };

  const COLORS = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* User Profile */}
        <UserProfileSection />

        {/* Savings Goals */}
        <SavingsGoalsSection />

        {/* Appearance */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Appearance</h2>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Dark Mode</span>
            </div>
            <Switch
              checked={settings?.dark_mode || false}
              onCheckedChange={(checked) => updateSettings({ dark_mode: checked })}
            />
          </div>
        </section>

        {/* Budget & Currency */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Budget & Currency</h2>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4">
              <label className="text-sm text-muted-foreground mb-2 block">Currency</label>
              <Select
                value={settings?.currency || 'INR'}
                onValueChange={(value) => {
                  const currency = CURRENCIES.find(c => c.code === value);
                  updateSettings({ 
                    currency: value, 
                    currency_symbol: currency?.symbol || '₹' 
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4">
              <label className="text-sm text-muted-foreground mb-2 block">Monthly Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {settings?.currency_symbol || '₹'}
                </span>
                <Input
                  type="number"
                  className="pl-8"
                  value={settings?.monthly_budget || ''}
                  onChange={(e) => updateSettings({ monthly_budget: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Categories</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCategorySheet(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="divide-y divide-border">
            {categories.map(category => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <div key={category.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: category.color || undefined }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.budget_limit && (
                        <p className="text-xs text-muted-foreground">
                          Budget: {settings?.currency_symbol}{Number(category.budget_limit).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!category.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Recurring Transactions */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recurring Transactions</h2>
          </div>
          {recurringTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recurring transactions</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recurringTransactions.map(rt => (
                <div key={rt.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {settings?.currency_symbol}{Number(rt.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rt.frequency} • Next: {format(new Date(rt.next_due_date), 'MMM d')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecurring(rt.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Export */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <button
            onClick={handleExportCSV}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Export to CSV</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </section>
      </main>

      {/* Add Category Sheet */}
      <Sheet open={showCategorySheet} onOpenChange={setShowCategorySheet}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Add Category</SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Icon</label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {CATEGORY_ICONS.slice(0, 12).map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setNewCategoryIcon(name)}
                    className={cn(
                      'p-3 rounded-xl transition-all',
                      newCategoryIcon === name 
                        ? 'bg-foreground text-background' 
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Icon className="h-5 w-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2 mt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      'h-10 w-10 rounded-full transition-transform',
                      newCategoryColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Budget Limit (optional)</label>
              <Input
                type="number"
                placeholder="0"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleAddCategory}
              disabled={isAddingCategory}
              className="w-full h-12"
            >
              {isAddingCategory ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav onAddClick={() => setShowAddSheet(true)} />
      <AddTransactionSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </div>
  );
}
