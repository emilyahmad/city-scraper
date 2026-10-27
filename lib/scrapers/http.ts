const TIMEOUT_MS = 10_000;
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function request(url: string, accept: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: accept, 'Accept-Language': 'en-US,en;q=0.9', ...init.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} from ${new URL(url).host}`);
  return response;
}

export const fetchText = async (url: string) => (await request(url, 'text/html')).text();

// `headers` is for API keys sent as headers, e.g. { Authorization: 'Bearer …' }
export const fetchJson = async <T>(url: string, headers?: Record<string, string>): Promise<T> =>
  (await request(url, 'application/json', { headers })).json();

export const postJson = async <T>(url: string, body: unknown): Promise<T> =>
  (
    await request(url, 'application/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  ).json();

// Like Promise.allSettled(items.map(task)), but only `limit` tasks run at once, to stay inside API rate limits
export async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: 'fulfilled', value: await task(items[i]) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Reads a `window.NAME = {...};` assignment. Other code can follow it in the same <script>,
// so this walks the braces (skipping over strings) to find where the object ends.
export function extractWindowJson<T>(html: string, name: string): T | null {
  const marker = `window.${name} = `;
  const start = html.indexOf('{', html.indexOf(marker));
  if (html.indexOf(marker) === -1 || start === -1) return null;

  let depth = 0;
  let inString = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (char === '\\') i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1)) as T;
  }
  return null;
}

export function stripHtml(text: string) {
  return text
    .replace(/<br\s*\/?>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Numeric entities, e.g. &#8217; for ’
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Converts a wall-clock time in a time zone (e.g. "2026-10-29", "22:30", "America/New_York") to an ISO string
export function zonedToIso(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // How far the zone is from UTC at that moment, read back through Intl
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(new Date(asUtc));
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const zoned = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
  return new Date(asUtc - (zoned - asUtc)).toISOString();
}
