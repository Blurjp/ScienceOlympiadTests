import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Beaker,
  BookOpen,
  FileText,
  Sparkles,
  Upload,
  Target,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About & Event Guide | Science Olympiad Tests',
  description:
    'Learn how SciolyPrep helps you prepare for Science Olympiad with AI-generated practice tests, exam-structure analysis, and PDF import. Includes a study guide to all 23 events.',
};

const TOPIC_GUIDES: { topic: string; blurb: string }[] = [
  {
    topic: 'Anatomy and Physiology',
    blurb:
      'Study the human body systems in depth. Each season focuses on different systems - practice identifying structures, explaining physiological processes, and interpreting clinical data.',
  },
  {
    topic: 'Astronomy',
    blurb:
      'Explore stellar evolution, galaxies, and deep-sky objects. Expect image-based identification questions, H-R diagram interpretation, and calculations involving luminosity and distance.',
  },
  {
    topic: 'Chemistry Lab',
    blurb:
      'Hands-on chemistry focused on periodic trends, reaction types, and lab technique. Practice balancing equations, predicting products, and analyzing experimental results.',
  },
  {
    topic: 'Disease Detectives',
    blurb:
      'Epidemiology in action - investigate disease outbreaks, study study-designs like cohort and case-control, and calculate measures such as relative risk and attack rates.',
  },
  {
    topic: 'Dynamic Planet',
    blurb:
      'Earth science with a rotating annual theme covering tectonics, oceans, or climate. Practice reading maps, cross-sections, and interpreting geologic data.',
  },
  {
    topic: 'Ecology',
    blurb:
      'Learn about ecosystems, energy flow, nutrient cycling, and population dynamics. Questions often feature food webs, biomes, and species interactions.',
  },
  {
    topic: 'Experimental Design',
    blurb:
      'Design and critique scientific experiments under time pressure. Practice identifying variables, writing hypotheses, and proposing controlled procedures.',
  },
  {
    topic: 'Fermi Questions',
    blurb:
      'Estimate answers to order-of-magnitude questions - from the number of piano tuners in Chicago to the weight of the ocean. Speed and reasoning matter more than precision.',
  },
  {
    topic: 'Forensics',
    blurb:
      'Apply chemistry, biology, and physics to crime scene analysis. Practice identifying fibers, powders, fingerprints, and chromatography patterns.',
  },
  {
    topic: 'Fossils',
    blurb:
      'Identify fossil specimens and their geologic contexts. Know taxonomy, modes of life preservation, and major events in Earth history.',
  },
  {
    topic: 'Machines',
    blurb:
      'Physics of simple and compound machines - levers, pulleys, inclined planes. Practice calculating mechanical advantage, efficiency, and forces.',
  },
  {
    topic: 'Microbe Mission',
    blurb:
      'Bacteria, viruses, fungi, and protists - their structure, reproduction, and roles in health and disease. Includes microscopy and staining techniques.',
  },
  {
    topic: 'Optics',
    blurb:
      'Geometric and physical optics - reflection, refraction, lenses, mirrors, and wave phenomena. Includes laser-shoot style problem solving.',
  },
  {
    topic: 'Ornithology',
    blurb:
      'Identify North American birds by sight and sound. Study anatomy, behavior, habitat, and conservation with a focus on the annual bird list.',
  },
  {
    topic: 'Reach for the Stars',
    blurb:
      'Introductory astronomy for Division B - stellar life cycles, galaxies, and space exploration. Practice with star charts and mission data.',
  },
  {
    topic: 'Rocks and Minerals',
    blurb:
      'Identify rock and mineral specimens using physical properties like hardness, cleavage, and luster. Understand rock cycles and formation environments.',
  },
  {
    topic: 'Tower',
    blurb:
      'Build a lightweight wooden tower that holds maximum weight. Practice physics calculations, wood selection, and structural design trade-offs.',
  },
  {
    topic: 'Wind Power',
    blurb:
      'Renewable energy engineering - blade design, turbine efficiency, and wind physics. Includes both build and written test components.',
  },
  {
    topic: 'Write It Do It',
    blurb:
      'Communication under pressure - one partner writes instructions for a structure, the other rebuilds it. Practice precise, unambiguous technical writing.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            About SciolyPrep
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            SciolyPrep is a practice platform for Science Olympiad competitors.
            We help you turn study time into scored results with realistic
            practice tests for every event - generated instantly, graded
            automatically, and tracked over time so you can see exactly where
            you are improving.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <Sparkles className="h-6 w-6 text-purple-600 mb-2" />
                <CardTitle className="text-base">AI Test Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pick any event and difficulty - Invitational, Regional,
                  State, or National - and get an original multiple-choice
                  practice test in seconds. Every question is generated fresh,
                  so you never memorize a fixed question bank.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <FileText className="h-6 w-6 text-blue-600 mb-2" />
                <CardTitle className="text-base">Exam-Inspired Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We analyze the structure of real exams from the scioly.org
                  Test Exchange - topic mix, question styles, difficulty
                  curve - then write brand-new questions that follow the same
                  format. No actual exam content is copied or reproduced.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Upload className="h-6 w-6 text-green-600 mb-2" />
                <CardTitle className="text-base">Import Your Own PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload any practice test PDF (or paste a Google Drive link)
                  and we will extract the questions so you can take it online
                  with a timer, automatic scoring, and full answer review.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who it's for */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who it&apos;s for</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p className="flex gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-gray-900">Division B &amp; C competitors</strong> who
                want extra reps beyond the official practice tests. Retake any
                test, compare scores, and watch your average climb.
              </span>
            </p>
            <p className="flex gap-2">
              <Beaker className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-gray-900">Coaches and captains</strong> who need
                placement exams or topic-specific quizzes quickly - generate
                one, share it, and review team results together.
              </span>
            </p>
            <p className="flex gap-2">
              <Target className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-gray-900">Self-studiers</strong> tackling a new
                event. Start at Invitational difficulty to build fundamentals,
                then work up to State and National level questions.
              </span>
            </p>
          </div>
        </div>

        {/* Event guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event study guide</h2>
          <p className="text-gray-600 mb-6">
            Short orientation for the most-practiced events on our platform.
            Each guide covers what the test emphasizes and how to practice it.
          </p>
          <div className="space-y-4">
            {TOPIC_GUIDES.map(({ topic, blurb }) => (
              <Card key={topic}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{topic}</h3>
                      <p className="text-sm text-gray-600">{blurb}</p>
                    </div>
                    <Link
                      href="/"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0"
                    >
                      Practice <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to practice?
            </h2>
            <p className="text-gray-600 mb-6">
              Generate your first test free - no download required.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create a Practice Test
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
