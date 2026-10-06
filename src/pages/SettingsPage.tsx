import { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { CURRENCIES, getIconComponent, CATEGORY_ICONS } from '@/lib/constants';
import { Moon, Download, RefreshCw, Plus, Trash2, ChevronRight, LogOut, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { buildTransactionsCsv } from '@/lib/csv';
import { UserProfileSection } from '@/components/UserProfileSection';
import { SavingsGoalsSection } from '@/components/SavingsGoalsSection';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export default function SettingsPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showRecurringSheet, setShowRecurringSheet] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('receipt');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [exportRange, setExportRange] = useState<'month' | '3months' | 'all'>('month');
  const [isExporting, setIsExporting] = useState(false);

  const { settings, updateSettings, isLoading } = useSettings();
  const { categories, addCategory, updateCategory, deleteCategory, isAdding: isAddingCategory, isUpdating: isUpdatingCategory } = useCategories();
  const { recurringTransactions, deleteRecurring } = useRecurringTransactions();
  const { transactions } = useTransactions();
  const { signOut, user } = useAuth();
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; count: number | null } | null>(null);
  const [recurringToDelete, setRecurringToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; icon: string; color: string; budget: string } | null>(null);

  const askDeleteCategory = async (id: string, name: string) => {
    setCategoryToDelete({ id, name, count: null });
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    setCategoryToDelete(prev => (prev?.id === id ? { ...prev, count: count ?? 0 } : prev));
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully' });
  };


  const handleExportCSV = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      let query = supabase
        .from('transactions')
        .select('date, type, amount, note, categories ( name )')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (exportRange !== 'all') {
        const start = exportRange === 'month'
          ? startOfMonth(new Date())
          : startOfMonth(subMonths(new Date(), 2));
        query = query.gte('date', format(start, 'yyyy-MM-dd'));
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: 'No transactions to export', variant: 'destructive' });
        return;
      }
      const csv = buildTransactionsCsv(data as any);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${exportRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete' });
      setShowExportSheet(false);
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
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

  const handleEditCategory = () => {
    if (!editingCategory) return;
    if (!editingCategory.name.trim()) {
      toast({ title: 'Please enter a category name', variant: 'destructive' });
      return;
    }
    updateCategory({
      id: editingCategory.id,
      name: editingCategory.name.trim(),
      icon: editingCategory.icon,
      color: editingCategory.color,
      budget_limit: editingCategory.budget ? parseFloat(editingCategory.budget) : null,
    }, {
      onSuccess: () => {
        toast({ title: 'Category updated' });
        setEditingCategory(null);
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
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory({
                        id: category.id,
                        name: category.name,
                        icon: category.icon,
                        color: category.color || '#6B7280',
                        budget: category.budget_limit != null ? String(category.budget_limit) : '',
                      })}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {!category.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => askDeleteCategory(category.id, category.name)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
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
                    onClick={() => setRecurringToDelete(rt.id)}
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
            onClick={() => setShowExportSheet(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Export to CSV</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </section>

        <Sheet open={showExportSheet} onOpenChange={setShowExportSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Export to CSV</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {([
                ['month', 'This month'],
                ['3months', 'Last 3 months'],
                ['all', 'All time'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setExportRange(value)}
                  className={cn(
                    'w-full p-4 rounded-xl border text-left font-medium transition-colors',
                    exportRange === value ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/50'
                  )}
                >
                  {label}
                </button>
              ))}
              <Button className="w-full mt-4" onClick={handleExportCSV} disabled={isExporting}>
                {isExporting ? 'Exporting…' : 'Export'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Account */}
        <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
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

      {/* Edit Category Sheet */}
      <Sheet open={!!editingCategory} onOpenChange={(o) => !o && setEditingCategory(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit Category</SheetTitle>
          </SheetHeader>
          {editingCategory && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Input
                  placeholder="Category name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Icon</label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {CATEGORY_ICONS.slice(0, 12).map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setEditingCategory({ ...editingCategory, icon: name })}
                      className={cn(
                        'p-3 rounded-xl transition-all',
                        editingCategory.icon === name
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
                      onClick={() => setEditingCategory({ ...editingCategory, color })}
                      className={cn(
                        'h-10 w-10 rounded-full transition-transform',
                        editingCategory.color === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
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
                  value={editingCategory.budget}
                  onChange={(e) => setEditingCategory({ ...editingCategory, budget: e.target.value })}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleEditCategory}
                disabled={isUpdatingCategory}
                className="w-full h-12"
              >
                {isUpdatingCategory ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav onAddClick={() => setShowAddSheet(true)} />

      <ConfirmDeleteDialog
        open={!!categoryToDelete}
        onOpenChange={(o) => !o && setCategoryToDelete(null)}
        title={`Delete "${categoryToDelete?.name ?? ''}"?`}
        description={
          categoryToDelete?.count == null
            ? 'Checking linked transactions…'
            : categoryToDelete.count === 0
              ? 'No transactions use this category. This cannot be undone.'
              : `${categoryToDelete.count} transaction${categoryToDelete.count === 1 ? '' : 's'} will become Uncategorized. This cannot be undone.`
        }
        onConfirm={() => {
          if (categoryToDelete) deleteCategory(categoryToDelete.id);
          setCategoryToDelete(null);
        }}
      />

      <ConfirmDeleteDialog
        open={!!recurringToDelete}
        onOpenChange={(o) => !o && setRecurringToDelete(null)}
        title="Delete recurring item?"
        description="Future transactions will no longer be created. Past transactions are kept."
        onConfirm={() => {
          if (recurringToDelete) deleteRecurring(recurringToDelete);
          setRecurringToDelete(null);
        }}
      />
      <AddTransactionSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </div>
  );
}
