/**
 * Tests for lib/win-back.ts — unsubscribe tokens, test selection, email rendering.
 */
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  selectNewTestsForUser,
  buildWinBackEmail,
  NewTestRow,
} from '@/lib/win-back';

// jest.setup.js sets ADMIN_SESSION_SECRET='test-session-secret'

describe('unsubscribe tokens', () => {
  it('round-trips a user id', () => {
    const token = createUnsubscribeToken('user-123');
    expect(token).toContain('user-123');
    expect(verifyUnsubscribeToken(token)).toBe('user-123');
  });

  it('rejects a tampered token', () => {
    const token = createUnsubscribeToken('user-123');
    const tampered = token.replace(/.$/, 'x');
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
    expect(verifyUnsubscribeToken('no-signature')).toBeNull();
    expect(verifyUnsubscribeToken('.sigonly')).toBeNull();
  });

  it('rejects a token signed for another user', () => {
    const token = createUnsubscribeToken('user-a');
    const parts = token.split('.');
    const forged = `user-b.${parts[1]}`;
    expect(verifyUnsubscribeToken(forged)).toBeNull();
  });
});

describe('selectNewTestsForUser', () => {
  const row = (over: Partial<NewTestRow>): NewTestRow => ({
    id: 't1',
    title: 'Anatomy 2026 Practice',
    topic: 'Anatomy',
    difficulty: 'Medium',
    description: 'A practice test.',
    isPublic: true,
    createdAt: '2026-10-01 00:00:00',
    ...over,
  });

  it('returns only tests created after the user last active, newest first', () => {
    const tests = [
      row({ id: 'old', createdAt: '2026-01-01 00:00:00' }),
      row({ id: 'mid', createdAt: '2026-09-01 00:00:00' }),
      row({ id: 'new', createdAt: '2026-10-15 00:00:00' }),
    ];
    const { links, totalCount } = selectNewTestsForUser(tests, '2026-08-01 00:00:00');
    expect(totalCount).toBe(2);
    expect(links.map((l) => l.id)).toEqual(['new', 'mid']);
  });

  it('caps links at 3 but counts everything eligible', () => {
    const tests = Array.from({ length: 5 }, (_, i) =>
      row({ id: `t${i}`, createdAt: `2026-10-0${i + 1} 00:00:00` })
    );
    const { links, totalCount } = selectNewTestsForUser(tests, null, 3);
    expect(links).toHaveLength(3);
    expect(totalCount).toBe(5);
  });

  it('drops page-ineligible tests (private or "Original Practice:")', () => {
    const tests = [
      row({ id: 'private', isPublic: false, createdAt: '2026-10-02 00:00:00' }),
      row({ id: 'original', title: 'Original Practice: Foo', createdAt: '2026-10-03 00:00:00' }),
      row({ id: 'ok', createdAt: '2026-10-04 00:00:00' }),
    ];
    const { links, totalCount } = selectNewTestsForUser(tests, '2026-09-01 00:00:00');
    expect(totalCount).toBe(1);
    expect(links[0].id).toBe('ok');
  });

  it('builds canonical public URLs', () => {
    const { links } = selectNewTestsForUser(
      [row({ id: 'abc', difficulty: 'Medium' })],
      '2026-09-01 00:00:00'
    );
    expect(links[0].url).toBe('/tests/anatomy/abc-medium-practice-test');
  });
});

describe('buildWinBackEmail', () => {
  const baseInput = {
    userName: 'Jane Doe',
    newTests: [
      { id: 't1', title: 'Anatomy 2026 Practice', url: '/tests/anatomy/t1-medium-practice-test' },
    ],
    newTestsCount: 3,
    siteUrl: 'https://sciolyprep.com',
    note: 'Regionals are <around> the corner!',
    unsubscribeToken: 'user-1.sig',
  };

  it('greets by first name and states the count in the subject', () => {
    const email = buildWinBackEmail(baseInput);
    expect(email.subject).toBe('3 new Science Olympiad practice tests since your last visit');
    expect(email.html).toContain('Hi Jane,');
    expect(email.text).toContain('Hi Jane,');
  });

  it('falls back to a generic greeting without a name', () => {
    const email = buildWinBackEmail({ ...baseInput, userName: null });
    expect(email.html).toContain('Hi there,');
  });

  it('links the new tests with absolute URLs', () => {
    const email = buildWinBackEmail(baseInput);
    expect(email.html).toContain('href="https://sciolyprep.com/tests/anatomy/t1-medium-practice-test"');
    expect(email.text).toContain('https://sciolyprep.com/tests/anatomy/t1-medium-practice-test');
  });

  it('escapes HTML in the admin note', () => {
    const email = buildWinBackEmail(baseInput);
    expect(email.html).not.toContain('<around>');
    expect(email.html).toContain('&lt;around&gt;');
  });

  it('includes 1-10 score links and the unsubscribe link', () => {
    const email = buildWinBackEmail(baseInput);
    for (let n = 1; n <= 10; n++) {
      expect(email.html).toContain(`/feedback?score=${n}`);
    }
    expect(email.html).toContain('/api/win-back/unsubscribe?token=user-1.sig');
    expect(email.text).toContain('/api/win-back/unsubscribe?token=user-1.sig');
  });

  it('handles zero new tests without list markup', () => {
    const email = buildWinBackEmail({
      ...baseInput,
      newTests: [],
      newTestsCount: 0,
    });
    expect(email.subject).toBe('New Science Olympiad practice tests since your last visit');
    expect(email.html).not.toContain('<ul');
    expect(email.text).toContain("We've been busy adding");
  });
});
