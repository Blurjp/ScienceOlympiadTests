import { DEFAULT_TOPICS } from './default-topics';

export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function unslugifyTopic(slug: string): string | undefined {
  return DEFAULT_TOPICS.find((t) => slugifyTopic(t) === slug);
}

/** Split a topic like 'Anatomy and Physiology' into short display parts. */
export function topicShortName(topic: string): string {
  return topic.replace(' and Physiology', '').replace(' Reach for the Stars', '');
}

/**
 * The prompt-formatted TOPIC_DESCRIPTIONS text uses ALL-CAPS section headers
 * and "- " bullets. Convert it to simple blocks for rendering.
 */
export function topicDescriptionBlocks(description: string): Array<
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
> {
  const blocks: Array<{ kind: 'p'; text: string } | { kind: 'h3'; text: string } | { kind: 'ul'; items: string[] }> = [];
  const lines = description.split('\n').map((l) => l.trimEnd());

  let intro: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const isHeader = /^[A-Z][A-Z0-9\s\/&()'+-]*:$/.test(t);
    if (isHeader) break;
    intro.push(t);
  }
  if (intro.length > 0) blocks.push({ kind: 'p', text: intro.join(' ') });

  let currentList: string[] | null = null;
  for (const line of lines.slice(intro.length)) {
    const t = line.trim();
    if (!t) continue;
    if (/^[A-Z][A-Z0-9\s\/&()'+-]*:$/.test(t)) {
      if (currentList) {
        blocks.push({ kind: 'ul', items: currentList });
        currentList = null;
      }
      blocks.push({ kind: 'h3', text: t.replace(/:$/, '') });
    } else if (t.startsWith('- ')) {
      currentList = currentList || [];
      currentList.push(t.slice(2));
    } else if (currentList) {
      currentList[currentList.length - 1] += ` ${t}`;
    } else {
      blocks.push({ kind: 'p', text: t });
    }
  }
  if (currentList) blocks.push({ kind: 'ul', items: currentList });

  return blocks;
}

export function eventFaq(topic: string): Array<{ q: string; a: string }> {
  return [
    {
      q: `How do I practice for ${topic} in Science Olympiad?`,
      a: `Start with the current year's rules manual for ${topic}, then drill practice tests in increasing difficulty: Invitational, then Regional, then State and National level. SciolyPrep generates unlimited original ${topic} practice tests at each difficulty level, so you can target your weak areas instead of hunting for scarce past exams.`,
    },
    {
      q: 'Are the practice tests free?',
      a: 'Yes - you get 5 free AI test generations every month, forever, no credit card needed. Paid plans unlock unlimited generations for the full season if you need more volume.',
    },
    {
      q: `What difficulty ${topic} test should I start with?`,
      a: 'Start at the Invitational or Regional level to build fundamentals, then move up to State and National difficulty as competition approaches. Regional tests mix recall with application; State and National tests add multi-step reasoning and data interpretation.',
    },
    {
      q: 'Can I practice with real past Science Olympiad exams?',
      a: 'Yes. You can import a past exam PDF from your computer or a Google Drive link, and the app parses every question into an interactive test. There is also an Exam-Inspired Generator that analyzes real exam structures (topic mix, format, difficulty) and writes 100% original new questions in that style.',
    },
  ];
}
