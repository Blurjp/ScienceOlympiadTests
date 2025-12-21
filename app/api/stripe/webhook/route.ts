import { NextRequest, NextResponse } from 'next/server';
import { stripe, getStripe } from '@/lib/stripe';
import { getUserByStripeCustomerId, updateUserSubscription } from '@/lib/database';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.customer) {
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer.id;

          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            // Get the subscription details
            const subscriptionId = typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id;

            if (subscriptionId) {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data'],
              }) as Stripe.Subscription;

              // Get current_period_end from the first subscription item
              const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

              await updateUserSubscription(user.id, {
                subscriptionStatus: 'active',
                subscriptionId: subscription.id,
                subscriptionCurrentPeriodEnd: currentPeriodEnd
                  ? new Date(currentPeriodEnd * 1000).toISOString()
                  : undefined,
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const user = await getUserByStripeCustomerId(customerId);
        if (user) {
          let status: 'free' | 'active' | 'canceled' | 'past_due' = 'free';

          switch (subscription.status) {
            case 'active':
            case 'trialing':
              status = 'active';
              break;
            case 'past_due':
              status = 'past_due';
              break;
            case 'canceled':
            case 'unpaid':
              status = 'canceled';
              break;
            default:
              status = 'free';
          }

          // Get current_period_end from the first subscription item
          const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

          await updateUserSubscription(user.id, {
            subscriptionStatus: status,
            subscriptionId: subscription.id,
            subscriptionCurrentPeriodEnd: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : undefined,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const user = await getUserByStripeCustomerId(customerId);
        if (user) {
          await updateUserSubscription(user.id, {
            subscriptionStatus: 'free',
            subscriptionId: undefined,
            subscriptionCurrentPeriodEnd: undefined,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (customerId) {
          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            await updateUserSubscription(user.id, {
              subscriptionStatus: 'past_due',
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        // Get subscription from parent.subscription_details (new Stripe SDK structure)
        const subscriptionData = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subscriptionData === 'string'
          ? subscriptionData
          : subscriptionData?.id;

        if (customerId && subscriptionId) {
          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data'],
            }) as Stripe.Subscription;

            // Get current_period_end from the first subscription item
            const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

            await updateUserSubscription(user.id, {
              subscriptionStatus: 'active',
              subscriptionCurrentPeriodEnd: currentPeriodEnd
                ? new Date(currentPeriodEnd * 1000).toISOString()
                : undefined,
            });
          }
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
