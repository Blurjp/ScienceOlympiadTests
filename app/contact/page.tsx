import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/contact/contact-form';
import { getSiteUrl } from '@/lib/site';
import { Mail, Clock, MessageCircle } from 'lucide-react';

const canonical = `${getSiteUrl()}/contact`;

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Science Olympiad Tests team. Questions, bug reports, feature requests, and billing support.',
  alternates: { canonical },
  openGraph: {
    url: canonical,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'SciolyPrep - AI-generated Science Olympiad practice tests',
      },
    ],
  },
};

const SUPPORT_EMAIL = 'support@aitrove.ai';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-2 text-gray-600">
            Found a bug, have a feature idea, or need help with your subscription? We want to hear
            from you.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 text-center">
            <Mail className="mx-auto h-5 w-5 text-blue-600" />
            <p className="mt-2 text-sm font-medium text-gray-900">Email us directly</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-1 block text-xs text-blue-600 hover:underline break-all"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-blue-600" />
            <p className="mt-2 text-sm font-medium text-gray-900">Response time</p>
            <p className="mt-1 text-xs text-gray-600">Usually within 1-2 business days</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <MessageCircle className="mx-auto h-5 w-5 text-blue-600" />
            <p className="mt-2 text-sm font-medium text-gray-900">Feature requests</p>
            <p className="mt-1 text-xs text-gray-600">We build what users ask for</p>
          </div>
        </div>

        <ContactForm />

        <div className="mt-10 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Spotted a mistake in a study guide or practice test?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Our questions are AI-generated and can contain errors — accuracy matters on a
              study site, so we fix reported errors quickly. Tell us the event, the
              question or guide section, and what&apos;s wrong (or just paste the
              sentence). You can also use the form above with subject
              &quot;Correction&quot;.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Copyright &amp; takedown
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              If you believe material on this site infringes your copyright, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                {SUPPORT_EMAIL}
              </a>{' '}
              with the URL and a description of the work. Imported exams are private by
              default and never republished without rights; we act on valid requests
              promptly.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          For account or billing questions, you can also manage your subscription from{' '}
          <Link href="/pricing" className="text-blue-600 hover:underline">
            the pricing page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
