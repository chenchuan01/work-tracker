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
  type: string; // 'html' | 'hn_api'
  enabled: number;
}

function hashId(title: string, source: string): string {
  let h = 0;
  const s = title + '::' + source;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// 从 HTML 中提取链接
function extractLinks(html: string, baseUrl: string, patterns: RegExp[]): { title: string; url: string }[] {
  const links: { title: string; url: string }[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      let url = match[1] || match[2] || '';
      let title = match[2] || match[1] || '';

      // 处理相对路径
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        url = urlObj.origin + url;
      }

      // 清理标题
      title = stripHtml(title).slice(0, 200);

      // 过滤无效链接
      if (!title || title.length < 4 || seen.has(url)) continue;
      if (url.includes('javascript:') || url === '#' || url.endsWith('.js') || url.endsWith('.css')) continue;

      seen.add(url);
      links.push({ title, url });

      if (links.length >= 30) break;
    }
    if (links.length >= 30) break;
  }

  return links;
}

// 36氪快讯
async function fetch36kr(source: NewsSource): Promise<NewsRawItem[]> {
  const html = await fetchWithTimeout(source.url);
  const patterns = [
    /href="(\/newsflashes\/\d+)"[^>]*>([^<]+)</g,
    /href="(https:\/\/36kr\.com\/newsflashes\/\d+)"[^>]*>([^<]+)</g,
  ];
  const links = extractLinks(html, 'https://36kr.com', patterns);
  return links.map(link => ({
    id: hashId(link.title, source.name),
    title: link.title,
    url: link.url.startsWith('http') ? link.url : `https://36kr.com${link.url}`,
    summary: '',
    source: source.name,
    category: source.category,
    publishedAt: Date.now(),
  }));
}

// 新浪新闻
async function fetchSina(source: NewsSource): Promise<NewsRawItem[]> {
  const html = await fetchWithTimeout(source.url);
  const patterns = [
    /href="(https:\/\/[^"]*sina\.com\.cn\/[^"]*\.shtml)"[^>]*>([^<]{8,})</g,
  ];
  const links = extractLinks(html, source.url, patterns);
  return links.map(link => ({
    id: hashId(link.title, source.name),
    title: link.title,
    url: link.url,
    summary: '',
    source: source.name,
    category: source.category,
    publishedAt: Date.now(),
  }));
}

// 网易新闻
async function fetch163(source: NewsSource): Promise<NewsRawItem[]> {
  const html = await fetchWithTimeout(source.url);
  const patterns = [
    /href="(https:\/\/[^"]*163\.com\/[^"]*article[^"]*\.html)"[^>]*>([^<]{8,})</g,
    /href="(https:\/\/news\.163\.com\/[^"]*\.html)"[^>]*>([^<]{8,})</g,
  ];
  const links = extractLinks(html, source.url, patterns);
  return links.map(link => ({
    id: hashId(link.title, source.name),
    title: link.title,
    url: link.url,
    summary: '',
    source: source.name,
    category: source.category,
    publishedAt: Date.now(),
  }));
}

// 腾讯新闻
async function fetchQQ(source: NewsSource): Promise<NewsRawItem[]> {
  const html = await fetchWithTimeout(source.url);
  const patterns = [
    /href="(https:\/\/[^"]*qq\.com\/[^"]*\.html)"[^>]*>([^<]{8,})</g,
  ];
  const links = extractLinks(html, source.url, patterns);
  return links.map(link => ({
    id: hashId(link.title, source.name),
    title: link.title,
    url: link.url,
    summary: '',
    source: source.name,
    category: source.category,
    publishedAt: Date.now(),
  }));
}

// Hacker News
async function fetchHackerNews(source: NewsSource): Promise<NewsRawItem[]> {
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

// 通用 HTML 抓取（根据 URL 判断使用哪个解析器）
async function fetchHTML(source: NewsSource): Promise<NewsRawItem[]> {
  const url = source.url;
  if (url.includes('36kr.com')) return fetch36kr(source);
  if (url.includes('sina.com.cn')) return fetchSina(source);
  if (url.includes('163.com')) return fetch163(source);
  if (url.includes('qq.com')) return fetchQQ(source);

  // 默认通用抓取
  const html = await fetchWithTimeout(url);
  const patterns = [
    /href="([^"]+)"[^>]*>([^<]{8,})</g,
  ];
  const links = extractLinks(html, url, patterns);
  return links.map(link => ({
    id: hashId(link.title, source.name),
    title: link.title,
    url: link.url.startsWith('http') ? link.url : new URL(link.url, url).href,
    summary: '',
    source: source.name,
    category: source.category,
    publishedAt: Date.now(),
  }));
}

export async function fetchAllSources(sources: NewsSource[]): Promise<NewsRawItem[]> {
  const enabled = sources.filter(s => s.enabled);
  const results = await Promise.allSettled(
    enabled.map(s => (s.type === 'hn_api' ? fetchHackerNews(s) : fetchHTML(s)))
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
    } else {
      console.error('[newsParser] 抓取失败:', r.reason);
    }
  }
  return all;
}
