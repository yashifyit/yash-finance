import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('skeleton-loader h-40 w-full', className)} />
  );
}

export function SkeletonTransaction() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="skeleton-loader h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-loader h-4 w-24" />
        <div className="skeleton-loader h-3 w-16" />
      </div>
      <div className="skeleton-loader h-5 w-20" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTransaction key={i} />
      ))}
    </div>
  );
}

export function SkeletonDonut() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="skeleton-loader h-48 w-48 rounded-full" />
    </div>
  );
}
