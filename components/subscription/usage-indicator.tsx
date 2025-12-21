'use client';

import { Progress } from '@/components/ui/progress';
import { Sparkles, Infinity } from 'lucide-react';

interface UsageIndicatorProps {
  used: number;
  limit: number;
  isPro: boolean;
  className?: string;
}

export function UsageIndicator({ used, limit, isPro, className }: UsageIndicatorProps) {
  if (isPro) {
    return (
      <div className={`flex items-center gap-2 text-sm text-emerald-600 ${className}`}>
        <Infinity className="h-4 w-4" />
        <span>Unlimited AI tests</span>
      </div>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          AI Tests
        </span>
        <span className={remaining === 0 ? 'text-destructive font-medium' : 'text-foreground'}>
          {used} / {limit} used
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {remaining === 0 && (
        <p className="text-xs text-destructive">
          Monthly limit reached. Upgrade to Pro for unlimited tests.
        </p>
      )}
      {remaining > 0 && remaining <= 2 && (
        <p className="text-xs text-amber-600">
          Only {remaining} free test{remaining === 1 ? '' : 's'} remaining this month.
        </p>
      )}
    </div>
  );
}
