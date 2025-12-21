'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpgradeButton } from './upgrade-button';
import { ManageSubscriptionButton } from './manage-subscription-button';
import { UsageIndicator } from './usage-indicator';
import { Crown, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { SubscriptionStatus } from '@/lib/database';
import Link from 'next/link';

interface SubscriptionSectionProps {
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  subscriptionCurrentPeriodEnd?: string;
}

export function SubscriptionSection({
  subscriptionStatus,
  isPro,
  subscriptionCurrentPeriodEnd,
}: SubscriptionSectionProps) {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success param
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setShowSuccess(true);
      // Remove the param from URL after showing
      const timeout = setTimeout(() => {
        window.history.replaceState({}, '', '/profile');
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [searchParams]);

  // Fetch usage for free users
  useEffect(() => {
    if (!isPro) {
      fetch('/api/user-usage')
        .then((res) => res.json())
        .then((data) => {
          if (data.used !== undefined) {
            setUsage({ used: data.used, limit: data.limit || 5 });
          }
        })
        .catch(console.error);
    }
  }, [isPro]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPro ? <Crown className="h-5 w-5 text-amber-500" /> : <Sparkles className="h-5 w-5" />}
              Subscription
            </CardTitle>
            <CardDescription>Manage your subscription plan</CardDescription>
          </div>
          <Badge variant={isPro ? 'default' : 'secondary'} className={isPro ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}>
            {isPro ? 'Pro' : 'Free'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success message */}
        {showSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            <span>Welcome to Pro! Your subscription is now active.</span>
          </div>
        )}

        {isPro ? (
          <>
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <Crown className="h-5 w-5" />
                Pro Plan
              </div>
              <p className="text-sm text-amber-700">
                Enjoy unlimited AI test generation and priority support.
              </p>
            </div>

            {subscriptionCurrentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Renews on {formatDate(subscriptionCurrentPeriodEnd)}</span>
              </div>
            )}

            <ManageSubscriptionButton className="w-full" />
          </>
        ) : (
          <>
            {usage && (
              <UsageIndicator
                used={usage.used}
                limit={usage.limit}
                isPro={false}
              />
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to Pro for unlimited AI-generated practice tests and support development.
              </p>
              <UpgradeButton className="w-full" />
            </div>

            <div className="text-center">
              <Link href="/pricing" className="text-sm text-primary hover:underline">
                View pricing details →
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
