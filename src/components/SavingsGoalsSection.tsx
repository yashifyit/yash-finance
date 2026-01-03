import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useSettings } from '@/hooks/useSettings';
import { Target, Plus, Trash2, PiggyBank } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { savingsGoalSchema, validateInput } from '@/lib/validations';

const GOAL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'
];

export function SavingsGoalsSection() {
  const { goals, addGoal, deleteGoal, addToGoal, isAdding, isLoading } = useSavingsGoals();
  const { settings } = useSettings();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showAddMoneySheet, setShowAddMoneySheet] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#3B82F6');

  const handleAddGoal = () => {
    const goalData = {
      name: newGoalName.trim(),
      target_amount: parseFloat(newGoalTarget) || 0,
      current_amount: 0,
      deadline: newGoalDeadline || null,
      color: newGoalColor,
      icon: 'target',
      is_completed: false,
    };

    const validation = validateInput(savingsGoalSchema, goalData);
    if (validation.success === false) {
      toast({ title: validation.error, variant: 'destructive' });
      return;
    }

    addGoal(goalData, {
      onSuccess: () => {
        toast({ title: 'Goal created!' });
        setNewGoalName('');
        setNewGoalTarget('');
        setNewGoalDeadline('');
        setShowAddSheet(false);
      }
    });
  };

  const handleAddMoney = () => {
    if (!selectedGoalId || !addMoneyAmount) return;
    
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0 || amount > 10000000) {
      toast({ title: 'Please enter a valid amount (max 10,000,000)', variant: 'destructive' });
      return;
    }
    
    addToGoal({ id: selectedGoalId, amount }, {
      onSuccess: () => {
        toast({ title: 'Money added to goal!' });
        setAddMoneyAmount('');
        setShowAddMoneySheet(false);
        setSelectedGoalId(null);
      }
    });
  };

  const openAddMoney = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowAddMoneySheet(true);
  };

  return (
    <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Savings Goals</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAddSheet(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      {goals.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No savings goals yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {goals.map(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            return (
              <div key={goal.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <Target className="h-5 w-5" style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {settings?.currency_symbol}{Number(goal.current_amount).toLocaleString()} / {settings?.currency_symbol}{Number(goal.target_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddMoney(goal.id)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Progress 
                  value={Math.min(progress, 100)} 
                  className="h-2"
                  style={{ '--progress-color': goal.color } as React.CSSProperties}
                />
                {goal.is_completed && (
                  <p className="text-xs text-green-500 mt-1 font-medium">🎉 Goal completed!</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Create Savings Goal</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Goal Name</label>
              <Input
                placeholder="e.g., Emergency Fund"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                maxLength={100}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Target Amount</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {settings?.currency_symbol || '₹'}
                </span>
                <Input
                  type="number"
                  placeholder="50000"
                  min="1"
                  max="10000000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Deadline (optional)</label>
              <Input
                type="date"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Color</label>
              <div className="flex gap-2 mt-2">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewGoalColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      newGoalColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button 
              onClick={handleAddGoal}
              disabled={isAdding}
              className="w-full h-12"
            >
              {isAdding ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Money Sheet */}
      <Sheet open={showAddMoneySheet} onOpenChange={setShowAddMoneySheet}>
        <SheetContent side="bottom" className="h-[35vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Add Money to Goal</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {settings?.currency_symbol || '₹'}
                </span>
                <Input
                  type="number"
                  placeholder="1000"
                  min="0.01"
                  max="10000000"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddMoney}
              className="w-full h-12"
            >
              Add Money
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
