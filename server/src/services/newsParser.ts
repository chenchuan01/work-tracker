import { XMLParser } from 'fast-xml-parser';

export interface NewsRawItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: number;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  type: string;
  enabled: number;
}

const xmlParser = new XMLParser({ ignoreAttributes: false });

function hashId(title: string, source: string): string {
  let h = 0;
  const s = title + '::' + source;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function parseDate(val: string | number | undefined): number {
  if (!val) return Date.now();
  const n = typeof val === 'number' ? val : Date.parse(val);
  return isNaN(n) ? Date.now() : n;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorkTracker/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRSS(source: NewsSource): Promise<NewsRawItem[]> {
  const text = await fetchWithTimeout(source.url);
  const parsed = xmlParser.parse(text);

  const channel = parsed?.rss?.channel ?? parsed?.feed ?? null;
  if (!channel) return [];

  const entries: unknown[] = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : Array.isArray(channel.entry)
    ? channel.entry
    : channel.entry
    ? [channel.entry]
    : [];

  return entries.slice(0, 30).map((item: any) => {
    const title = stripHtml(String(item.title ?? '')).slice(0, 200);
    const url = String(item.link?.['#text'] ?? item.link ?? item.id ?? '');
    const raw = item.description ?? item.summary ?? item.content ?? item['content:encoded'] ?? '';
    const summary = stripHtml(String(raw)).slice(0, 300);
    const pubDate = item.pubDate ?? item.published ?? item.updated ?? item['dc:date'] ?? '';
    return {
      id: hashId(title, source.name),
      title,
      url,
      summary,
      source: source.name,
      category: source.category,
      publishedAt: parseDate(pubDate),
    };
  }).filter(i => i.title && i.url);
}

export async function fetchHackerNews(source: NewsSource): Promise<NewsRawItem[]> {
  const idsText = await fetchWithTimeout(source.url);
  const ids: number[] = JSON.parse(idsText).slice(0, 20);

  const items = await Promise.allSettled(
    ids.map(id =>
      fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(t => JSON.parse(t))
    )
  );

  return items
    .filter(r => r.status === 'fulfilled' && r.value?.title)
    .map((r: any) => {
      const v = r.value;
      return {
        id: hashId(v.title, 'Hacker News'),
        title: v.title,
        url: v.url ?? `https://news.ycombinator.com/item?id=${v.id}`,
        summary: '',
        source: 'Hacker News',
        category: source.category,
        publishedAt: (v.time ?? 0) * 1000,
      };
    });
}

export async function fetchAllSources(sources: NewsSource[]): Promise<NewsRawItem[]> {
  const enabled = sources.filter(s => s.enabled);
  const results = await Promise.allSettled(
    enabled.map(s => (s.type === 'hn_api' ? fetchHackerNews(s) : fetchRSS(s)))
  );

  const all: NewsRawItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    }
  }
  return all;
}
