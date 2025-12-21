'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/subscription/pricing-card';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import { ManageSubscriptionButton } from '@/components/subscription/manage-subscription-button';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const FREE_FEATURES = [
  '5 AI-generated tests per month',
  'Access to all practice tests',
  'Basic progress tracking',
  'All Science Olympiad topics',
  'PDF parsing and import',
];

const PRO_FEATURES = [
  'Unlimited AI-generated tests',
  'Priority test generation',
  'All Free features included',
  'Support development',
  'Cancel anytime',
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  const isLoading = status === 'loading';
  const isPro = session?.user?.isPro;
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for your Science Olympiad practice needs
          </p>
        </div>

        {/* Canceled notice */}
        {canceled && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">
              Checkout was canceled. You can try again anytime.
            </p>
          </div>
        )}

        {/* Already Pro notice */}
        {isPro && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-emerald-800">
                You&apos;re on the Pro plan! Enjoy unlimited AI test generation.
              </p>
            </div>
            <ManageSubscriptionButton variant="outline" size="sm" />
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <PricingCard
            name="Free"
            price="Free"
            description="Perfect for getting started"
            features={FREE_FEATURES}
            currentPlan={isLoggedIn && !isPro}
          >
            {isLoggedIn ? (
              isPro ? (
                <Button variant="outline" disabled className="w-full">
                  Current: Pro Plan
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  Current Plan
                </Button>
              )
            ) : (
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            )}
          </PricingCard>

          {/* Pro Tier */}
          <PricingCard
            name="Pro"
            price="$4.99"
            period="/month"
            description="For serious competitors"
            features={PRO_FEATURES}
            highlighted={!isPro}
            currentPlan={isPro}
          >
            {isLoading ? (
              <Button disabled className="w-full">
                Loading...
              </Button>
            ) : isPro ? (
              <ManageSubscriptionButton className="w-full" />
            ) : isLoggedIn ? (
              <UpgradeButton className="w-full" />
            ) : (
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sign up to upgrade
                </Button>
              </Link>
            )}
          </PricingCard>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What counts as an AI test generation?</h3>
              <p className="text-muted-foreground">
                Each time you generate a new practice test using our AI, it counts as one generation.
                This includes tests from the AI Test Generator and Exam-Inspired Generator.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">When does my monthly limit reset?</h3>
              <p className="text-muted-foreground">
                Your free tier limit resets on the 1st of each month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my Pro subscription anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can cancel your subscription at any time from the subscription management portal.
                You&apos;ll continue to have Pro access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit and debit cards through our secure payment partner, Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button variant="ghost">
              ← Back to Practice Tests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
