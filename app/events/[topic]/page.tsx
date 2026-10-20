import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { TOPIC_DESCRIPTIONS } from '@/lib/topic-descriptions';
import { slugifyTopic, unslugifyTopic, topicDescriptionBlocks, eventFaq } from '@/lib/event-pages';
import { CheckCircle2, FileText, Sparkles, Upload, BarChart3 } from 'lucide-react';

interface EventPageProps {
  params: { topic: string };
}

export function generateStaticParams() {
  return DEFAULT_TOPICS.map((topic) => ({ topic: slugifyTopic(topic) }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const topic = unslugifyTopic(params.topic);
  if (!topic) return {};
  const base = getSiteUrl();
  const title = `${topic} Practice Tests - Free AI Generator`;
  const description = `Practice ${topic} for Science Olympiad with AI-generated tests at Invitational, Regional, State, and National difficulty. Import past exam PDFs and track your progress. Free to start.`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/events/${params.topic}` },
    openGraph: {
      title,
      description,
      url: `${base}/events/${params.topic}`,
      type: 'website',
      siteName: 'Science Olympiad Tests',
      images: [
        {
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${topic} practice tests on SciolyPrep`,
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const topic = unslugifyTopic(params.topic);
  if (!topic) notFound();

  const base = getSiteUrl();
  const description = TOPIC_DESCRIPTIONS[topic] || `Practice questions for ${topic}.`;
  const blocks = topicDescriptionBlocks(description);
  const faq = eventFaq(topic);

  // Show up to 6 related events for internal linking
  const related = DEFAULT_TOPICS.filter((t) => t !== topic).slice(0, 6);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Events', item: `${base}/events` },
      { '@type': 'ListItem', position: 3, name: topic, item: `${base}/events/${params.topic}` },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/events" className="hover:text-blue-600">Events</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{topic}</span>
        </nav>

        <h1 className="text-4xl font-bold text-gray-900">{topic} Practice Tests</h1>
        <p className="mt-4 text-lg text-gray-600">
          Free, AI-generated {topic} practice tests for Science Olympiad. Choose
          Invitational, Regional, State, or National difficulty, import past exam PDFs, and
          track your scores over time.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/">
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Sparkles className="h-4 w-4" />
              Generate a {topic} test
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import an exam PDF
            </Button>
          </Link>
        </div>

        {/* What's tested */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">What {topic} Tests Cover</h2>
          <div className="mt-4 prose prose-gray max-w-none text-gray-700">
            {blocks.map((block, i) => {
              if (block.kind === 'h3') {
                return (
                  <h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                    {block.text.charAt(0) + block.text.slice(1).toLowerCase()}
                  </h3>
                );
              }
              if (block.kind === 'ul') {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-1 mt-2">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="mt-3">
                  {block.text}
                </p>
              );
            })}
          </div>
        </section>

        {/* How the app helps */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">How SciolyPrep Helps You Practice</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-base mt-2">AI Test Generator</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Original {topic} questions at your chosen difficulty, generated in seconds.
                Every question includes a verified answer.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-base mt-2">Real Exam Structures</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Import past {topic} exam PDFs, or use the Exam-Inspired Generator to get new
                questions modeled on real exam formats.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <CardTitle className="text-base mt-2">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Scores, timing, and weak-area insights for every attempt, so you know exactly
                what to review before competition day.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Frequently Asked Questions About {topic}
          </h2>
          <div className="mt-4 space-y-4">
            {faq.map((item) => (
              <Card key={item.q}>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold text-gray-900 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-1 shrink-0" />
                    {item.q}
                  </h3>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">{item.a}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related events */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">Practice Other Science Olympiad Events</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t}
                href={`/events/${slugifyTopic(t)}`}
                className="rounded-full border bg-white px-4 py-2 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {t}
              </Link>
            ))}
            <Link
              href="/events"
              className="rounded-full border bg-white px-4 py-2 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              All events →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
