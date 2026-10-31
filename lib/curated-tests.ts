// Curated per-test pages that search engines may INDEX. Everything else
// with a public page renders noindex,follow (see app/tests/[topic]/[slug]).
//
// Policy (docs review, 2026-10-31): index ONE test per event x difficulty —
// hundreds of near-identical AI-generated pages trip Google's scaled-content
// spam policy and can drag the whole domain down. A test is promoted here
// only when it (a) is public original content, (b) has >= 10 questions, and
// (c) a human has checked the content. Regenerate candidates with:
//   node scripts/suggest-curated-tests.js
// then eyeball the questions before adding the id here.
//
// Review status: the 19 ids below were picked by the script (most questions
// per event x difficulty) and spot-checked on 2026-10-31 (Astronomy Medium,
// Disease Detectives Medium, Machines Medium sampled; all coherent, on-topic
// multiple choice). Full per-page review still pending - prune freely.
export const CURATED_TEST_IDS: readonly string[] = [
  // Astronomy | Easy | 10q
  '1793155791527-kef9kdxv2',
  // Astronomy | Medium | 18q
  '1764904288913-rqr73jbsr',
  // Botany | Easy | 10q
  '1793276196265-kkpux71u5',
  // Chemistry Lab | Medium | 10q
  '1793228328561-tvr9clxc4',
  // Designer Genes | Hard | 10q
  '1793417472456-qj80ndm17',
  // Disease Detectives | Medium | 18q
  '1764714297301-4aa2w9k7k',
  // Experimental Design | Medium | 10q
  '1793137125582-gs8s70spk',
  // Food Science | Easy | 10q
  '1793135647038-jq45pv2nn',
  // Food Science | Medium | 10q
  '1793135320483-b6z1vbrjg',
  // Machines | Medium | 17q
  '1764884391167-j8m3qlu6o',
  // Meteorology | Easy | 10q
  '1793251309952-zeutzcsbm',
  // Meteorology | Medium | 10q
  '1793074576127-t297q4yam',
  // Remote Sensing | Easy | 10q
  '1793301796108-2k87pm2uw',
  // Rocks and Minerals | Easy | 10q
  '1793163037295-cs4t7b7c1',
  // Rocks and Minerals | Medium | 10q
  '1793134215768-r6732ogv4',
  // Solar System | Easy | 10q
  '1793280997145-2qijajmht',
  // Solar System | Medium | 10q
  '1793156966493-amv7zwvtr',
  // Thermodynamics | Medium | 10q
  '1793162166411-r6qmw2q23',
  // Water Quality | Easy | 10q
  '1793291537930-q17btf1b8',
];

const CURATED_SET: ReadonlySet<string> = new Set(CURATED_TEST_IDS);

export function isCuratedTestId(testId: string): boolean {
  return CURATED_SET.has(testId);
}
