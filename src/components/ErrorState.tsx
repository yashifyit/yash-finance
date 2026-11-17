import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  onRetry: () => void | Promise<unknown>;
  message?: string;
}

export function ErrorState({ onRetry, message = 'Something went wrong while loading this page.' }: ErrorStateProps) {
  return (
    <section role="alert" className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-destructive" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-foreground">Unable to load</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" className="mt-5" onClick={() => { void onRetry(); }}>
        <RotateCw aria-hidden="true" />
        Retry
      </Button>
    </section>
  );
}