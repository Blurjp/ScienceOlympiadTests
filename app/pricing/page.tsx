'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/subscription/pricing-card';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import { ManageSubscriptionButton } from '@/components/subscription/manage-subscription-button';
import { Sparkles, AlertCircle, Flame } from 'lucide-react';
import { getActivePromotion, formatDiscountedPrice } from '@/lib/promotion';

const FREE_FEATURES = [
  '5 AI-generated tests per month (10 questions each)',
  'Access to all practice tests',
  'Basic progress tracking',
  'All Science Olympiad topics',
  'PDF parsing and import',
];

const PRO_FEATURES = [
  'Unlimited AI-generated tests',
  'Up to 40 questions per test (free: 10)',
  'AI explanations for every answer on your results',
  'Export tests as printable PDFs with answer keys',
  'Export from the library, history, or results screen',
  'Priority test generation',
  'All Free features included',
  'Support development',
  'Cancel anytime',
];

const SEASON_FEATURES = [
  'Everything in Pro for the full season',
  'Covers Sep 1 – May 31',
  'One-time payment — nothing to cancel',
  'Saves over 55% vs paying monthly',
  'Priority support',
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  const isLoading = status === 'loading';
  const isPro = session?.user?.isPro;
  const isSeason = session?.user?.subscriptionIsSeason;
  const isLoggedIn = !!session?.user;
  const promotion = getActivePromotion();

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

        {/* Black Friday promotion banner */}
        {promotion && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-800">
              <Flame className="h-5 w-5 text-red-600" />
              <span className="font-semibold">
                {promotion.name} — {promotion.percentOff}% off Pro and the Season Pass
              </span>
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <p className="mt-1 text-sm text-red-700">
              Discount applies automatically at checkout. Subscribe during the
              sale and the Pro discount stays with your subscription for life.
              Ends {promotion.endsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
            </p>
          </div>
        )}

        {/* Canceled notice */}
        {canceled && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">
              Checkout was canceled. You can try again anytime.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                  Included with {isSeason ? 'Season Pass' : 'Pro'}
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
            price={formatDiscountedPrice(4.99, promotion)}
            originalPrice={promotion ? '$4.99' : undefined}
            period="/month"
            description="For serious competitors"
            features={PRO_FEATURES}
            highlighted={!isPro}
            currentPlan={isPro && !isSeason}
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

          {/* Season Pass Tier */}
          <PricingCard
            name="Season Pass"
            price={formatDiscountedPrice(19.99, promotion)}
            originalPrice={promotion ? '$19.99' : undefined}
            period="/season"
            description="One payment. The whole competition season."
            features={SEASON_FEATURES}
            currentPlan={isSeason}
          >
            {isLoading ? (
              <Button disabled className="w-full">
                Loading...
              </Button>
            ) : isPro ? (
              <ManageSubscriptionButton variant="outline" className="w-full" />
            ) : isLoggedIn ? (
              <UpgradeButton plan="season" variant="secondary" className="w-full" />
            ) : (
              <Link href="/login" className="w-full">
                <Button variant="secondary" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sign up for the Season Pass
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
              <h3 className="font-semibold mb-2">How many questions can a generated test have?</h3>
              <p className="text-muted-foreground">
                Free plan tests include up to 10 questions. Pro subscribers can generate tests
                with up to 40 questions — everyone can see the 30- and 40-question options in the
                generator, and upgrading unlocks them instantly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I export my tests as PDFs?</h3>
              <p className="text-muted-foreground">
                Yes, with Pro. Export any test you own as a print-ready PDF (with an answer key
                page) from the test library, your history page, the test screen, or the results
                screen. Free plan users can see the export buttons and upgrade from there.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does the Black Friday discount work?</h3>
              <p className="text-muted-foreground">
                During the Black Friday sale (Nov 27–30), both plans are 50% off — the discount
                is applied automatically at checkout, no code needed. Pro subscribers who sign up
                during the sale keep 50% off for as long as they stay subscribed.
              </p>
            </div>
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
              <h3 className="font-semibold mb-2">What&apos;s the difference between Pro and the Season Pass?</h3>
              <p className="text-muted-foreground">
                Same access, different shape. Pro is $4.99/month and renews until you cancel. The
                Season Pass is $19.99 once and covers the whole competition season (September 1 –
                May 31) — saving over 55% with nothing to remember to cancel.
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
