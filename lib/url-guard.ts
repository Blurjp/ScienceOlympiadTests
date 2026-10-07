// SSRF protection for user-supplied URL fetching.
import dns from 'dns';
import net from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'metadata.google.internal',
  'metadata.goog',
]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;                   // loopback/private
  if (a === 169 && b === 254) return true;                             // link-local (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;                    // private
  if (a === 192 && b === 168) return true;                             // private
  if (a === 100 && b >= 64 && b <= 127) return true;                   // CGNAT
  if (a >= 224) return true;                                           // multicast/reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;                  // unspecified/loopback
  if (lower.startsWith('fe80')) return true;                           // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;   // unique local
  if (lower.startsWith('::ffff:')) {
    // IPv4-mapped IPv6 address. Node normalizes these to hex form,
    // e.g. ::ffff:127.0.0.1 becomes ::ffff:7f00:1
    const hex = lower.slice('::ffff:'.length);
    const groups = hex.split(':');
    if (groups.length === 2 && groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
      const hi = parseInt(groups[0], 16);
      const lo = parseInt(groups[1], 16);
      const v4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateIPv4(v4);
    }
    return true; // malformed mapped address - reject
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

/**
 * Validate that a URL is safe to fetch server-side:
 * - http/https scheme only
 * - not a blocked metadata hostname
 * - resolves to a public IP (blocks localhost/private/link-local/metadata ranges)
 * - respects a hostname allowlist when one is provided
 */
export async function assertSafeUrl(
  rawUrl: string,
  allowedHostSuffixes?: string[]
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL provided');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https URLs are allowed');
  }

  // URL.hostname keeps brackets for IPv6 literals ([::1]) - strip them
  const hostname = url.hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^\[/, '')
    .replace(/\]$/, '');

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UnsafeUrlError('This hostname is not allowed');
  }

  if (allowedHostSuffixes && allowedHostSuffixes.length > 0) {
    const allowed = allowedHostSuffixes.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
    if (!allowed) {
      throw new UnsafeUrlError('This host is not in the allowed list');
    }
  }

  // Literal IP in the URL
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new UnsafeUrlError('Requests to private IP addresses are not allowed');
    }
    return url;
  }

  // Resolve hostname and check every address it points to
  let addresses: { address: string }[];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError('Could not resolve hostname');
  }

  if (addresses.length === 0) {
    throw new UnsafeUrlError('Could not resolve hostname');
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new UnsafeUrlError('Requests to private IP addresses are not allowed');
    }
  }

  return url;
}

/**
 * Fetch a user-supplied URL with SSRF protections:
 * - validates every hop (including redirects) against assertSafeUrl
 * - caps the downloaded body size regardless of Content-Length headers
 */
export async function safeFetch(
  rawUrl: string,
  maxBytes: number,
  init?: RequestInit,
  maxRedirects = 3
): Promise<{ response: Response; body: Uint8Array }> {
  let currentUrl = await assertSafeUrl(rawUrl);

  let response: Response;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    // Follow redirects manually so each hop is re-validated
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new UnsafeUrlError('Redirect without a Location header');
      }
      if (hop === maxRedirects) {
        throw new UnsafeUrlError('Too many redirects');
      }
      currentUrl = await assertSafeUrl(new URL(location, currentUrl).toString());
      continue;
    }
    break;
  }

  // Consume the body with a hard cap (defeats chunked-encoding size bypass)
  const reader = response!.body?.getReader();
  if (!reader) {
    const buf = new Uint8Array(await response!.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw new UnsafeUrlError('File is too large');
    }
    return { response: response!, body: buf };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new UnsafeUrlError('File is too large');
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { response: response!, body };
}
