/**
 * Tests for lib/url-guard.ts (SSRF protection)
 */
import { assertSafeUrl, safeFetch, UnsafeUrlError } from '@/lib/url-guard';

// Mock DNS lookup to avoid real network calls
jest.mock('dns', () => ({
  lookup: jest.fn((_hostname: string, _opts: any, callback: any) => {
    if (typeof _opts === 'function') {
      callback = _opts;
      _opts = {};
    }
    // Default: resolve everything to a public IP
    const entry = { address: '93.184.216.34', family: 4 };
    callback(null, _opts?.all ? [entry] : entry);
  }),
  promises: {
    lookup: jest.fn(async (_hostname: string, opts?: any) => {
      const entry = { address: '93.184.216.34', family: 4 };
      return opts?.all ? [entry] : entry;
    }),
  },
}));

import dns from 'dns';

const mockLookup = dns.promises.lookup as jest.MockedFunction<typeof dns.promises.lookup>;

describe('assertSafeUrl', () => {
  test('accepts a normal https URL', async () => {
    const url = await assertSafeUrl('https://example.com/file.pdf');
    expect(url.hostname).toBe('example.com');
  });

  test('accepts an http URL', async () => {
    const url = await assertSafeUrl('http://example.com/file.pdf');
    expect(url.protocol).toBe('http:');
  });

  test('rejects non-http schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('ftp://example.com/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects invalid URLs', async () => {
    await expect(assertSafeUrl('not-a-url')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects literal private IPv4 addresses', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://10.0.0.1/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://192.168.1.1/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://172.16.0.1/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://0.0.0.0/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects literal IPv6 loopback/unique-local addresses', async () => {
    await expect(assertSafeUrl('http://[::1]/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://[fe80::1]/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://[fd00::1]/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects IPv4-mapped IPv6 addresses', async () => {
    await expect(assertSafeUrl('http://[::ffff:127.0.0.1]/file.pdf')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://[::ffff:169.254.169.254]/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects cloud metadata hostnames', async () => {
    await expect(assertSafeUrl('http://metadata.google.internal/computeMetadata/v1/')).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl('http://metadata.goog/computeMetadata/v1/')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects hostnames that resolve to private IPs (DNS rebinding guard)', async () => {
    mockLookup.mockResolvedValueOnce([{ address: '192.168.0.1', family: 4 }] as any);
    await expect(assertSafeUrl('https://evil.example.com/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects when any resolved address is private', async () => {
    mockLookup.mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ] as any);
    await expect(assertSafeUrl('https://mixed.example.com/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects when DNS resolution fails', async () => {
    mockLookup.mockRejectedValueOnce(new Error('ENOTFOUND'));
    await expect(assertSafeUrl('https://nonexistent.example.com/file.pdf')).rejects.toThrow(UnsafeUrlError);
  });

  test('enforces hostname allowlist when provided', async () => {
    await expect(
      assertSafeUrl('https://scioly.org/tests/test.pdf', ['scioly.org'])
    ).resolves.toBeInstanceOf(URL);

    await expect(
      assertSafeUrl('https://example.com/evil.pdf', ['scioly.org'])
    ).rejects.toThrow(UnsafeUrlError);
  });

  test('allowlist accepts subdomains', async () => {
    await expect(
      assertSafeUrl('https://tests.scioly.org/test.pdf', ['scioly.org'])
    ).resolves.toBeInstanceOf(URL);
  });
});

describe('safeFetch', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  function mockFetchOnce(status: number, body: Uint8Array, headers: Record<string, string> = {}) {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(body as any, { status, headers })
    );
  }

  test('returns body bytes for a direct response', async () => {
    const payload = new TextEncoder().encode('%PDF-1.4 fake content');
    mockFetchOnce(200, payload, { 'content-type': 'application/pdf' });

    const { body } = await safeFetch('https://example.com/test.pdf', 1024);
    expect(new TextDecoder().decode(body)).toContain('%PDF-1.4');
  });

  test('rejects bodies larger than maxBytes (defeats chunked encoding bypass)', async () => {
    const bigPayload = new Uint8Array(100);
    mockFetchOnce(200, bigPayload);

    await expect(safeFetch('https://example.com/test.pdf', 50)).rejects.toThrow(UnsafeUrlError);
  });

  test('follows redirects but re-validates each hop', async () => {
    const payload = new TextEncoder().encode('%PDF-1.4 ok');
    global.fetch = jest.fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest' } })
      )
      .mockResolvedValueOnce(new Response(payload as any, { status: 200 }));

    // Redirect target is a metadata IP - must be rejected
    await expect(safeFetch('https://example.com/redirect', 1024)).rejects.toThrow(UnsafeUrlError);
  });

  test('follows safe redirects successfully', async () => {
    const payload = new TextEncoder().encode('%PDF-1.4 ok');
    global.fetch = jest.fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://other.example.com/final.pdf' } })
      )
      .mockResolvedValueOnce(new Response(payload as any, { status: 200 }));

    const { body } = await safeFetch('https://example.com/redirect', 1024);
    expect(body.length).toBeGreaterThan(0);
  });

  test('rejects redirect loops beyond maxRedirects', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://example.com/loop' } })
    );

    await expect(safeFetch('https://example.com/loop', 1024)).rejects.toThrow(UnsafeUrlError);
  });

  test('rejects redirect without location header', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, { status: 302 })
    );

    await expect(safeFetch('https://example.com/redirect', 1024)).rejects.toThrow(UnsafeUrlError);
  });
});
