import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSettings } from '@/hooks/useSettings';
import { User, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function UserProfileSection() {
  const { settings, updateSettings, isUpdating } = useSettings();
  const [showEditSheet, setShowEditSheet] = useState(false);
  
  const [name, setName] = useState(settings?.user_name || '');
  const [age, setAge] = useState(settings?.user_age?.toString() || '');
  const [occupation, setOccupation] = useState(settings?.user_occupation || '');

  const handleOpenEdit = () => {
    setName(settings?.user_name || '');
    setAge(settings?.user_age?.toString() || '');
    setOccupation(settings?.user_occupation || '');
    setShowEditSheet(true);
  };

  const handleSave = () => {
    updateSettings({
      user_name: name.trim() || null,
      user_age: age ? parseInt(age) : null,
      user_occupation: occupation.trim() || null,
    });
    toast({ title: 'Profile updated!' });
    setShowEditSheet(false);
  };

  const hasProfile = settings?.user_name || settings?.user_age || settings?.user_occupation;

  return (
    <section className="bg-card rounded-2xl shadow-premium overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Profile</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleOpenEdit}
        >
          <Pencil className="h-4 w-4 mr-1" />
          {hasProfile ? 'Edit' : 'Setup'}
        </Button>
      </div>
      
      {!hasProfile ? (
        <div className="p-8 text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Set up your profile for personalized greetings</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{settings.user_name}</p>
              <p className="text-sm text-muted-foreground">
                {settings.user_age && `${settings.user_age} years`}
                {settings.user_age && settings.user_occupation && ' • '}
                {settings.user_occupation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom" className="h-[55vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit Profile</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your Name</label>
              <Input
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <Input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Occupation</label>
              <Input
                placeholder="Software Engineer"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full h-12"
            >
              {isUpdating ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
