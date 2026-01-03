import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories, Category } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { getIconComponent } from '@/lib/constants';
import { format } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { transactionSchema, validateInput } from '@/lib/validations';

interface AddTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionSheet({ open, onOpenChange }: AddTransactionSheetProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { addTransaction, isAdding } = useTransactions();
  const { settings } = useSettings();
  const currencySymbol = settings?.currency_symbol || '₹';

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    
    const transactionData = {
      type,
      amount: parsedAmount,
      category_id: categoryId,
      date: format(date, 'yyyy-MM-dd'),
      note: note.trim() || null,
      is_recurring: false,
      recurring_id: null,
    };

    const validation = validateInput(transactionSchema, transactionData);
    if (validation.success === false) {
      toast({ title: validation.error, variant: 'destructive' });
      return;
    }

    addTransaction(transactionData, {
      onSuccess: () => {
        toast({ title: `${type === 'expense' ? 'Expense' : 'Income'} added` });
        resetForm();
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: 'Failed to add transaction', variant: 'destructive' });
      }
    });
  };

  const resetForm = () => {
    setAmount('');
    setCategoryId(null);
    setDate(new Date());
    setNote('');
    setType('expense');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-xl">Add Transaction</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-8">
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium transition-all',
                type === 'expense' 
                  ? 'bg-card shadow-sm text-destructive' 
                  : 'text-muted-foreground'
              )}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium transition-all',
                type === 'income' 
                  ? 'bg-card shadow-sm text-success' 
                  : 'text-muted-foreground'
              )}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-light text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                min="0.01"
                max="10000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 text-4xl font-semibold h-20 border-0 bg-muted rounded-xl focus-visible:ring-2"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            {categoriesLoading ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-loader h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  const isSelected = categoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setCategoryId(isSelected ? null : category.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                        isSelected 
                          ? 'bg-foreground text-background' 
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <div 
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center',
                          isSelected ? 'bg-background/20' : ''
                        )}
                        style={{ 
                          backgroundColor: isSelected ? undefined : `${category.color}20`,
                        }}
                      >
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: isSelected ? 'currentColor' : category.color || undefined }}
                        />
                      </div>
                      <span className="text-xs font-medium truncate w-full text-center">
                        {category.name}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12 rounded-xl bg-muted border-0"
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Note (optional)</label>
            <Textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="resize-none h-20 rounded-xl bg-muted border-0"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isAdding || !amount}
            className="w-full h-14 rounded-xl text-lg font-semibold"
          >
            {isAdding ? 'Adding...' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
