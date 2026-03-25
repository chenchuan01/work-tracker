import { NewsRawItem } from './newsParser.js';

export interface AiScoreResult {
  id: string;
  score: number;
  recommended: boolean;
  reason: string;
}

export interface AiConfig {
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
}

export interface NewsPreferences {
  keywords: string[];
  excludeKeywords: string[];
}

const BATCH_SIZE = 20;

function buildScoringPrompt(items: NewsRawItem[], prefs: NewsPreferences): string {
  const interestLine = prefs.keywords.length
    ? `用户感兴趣的主题：${prefs.keywords.join('、')}`
    : '用户对科技、AI、财经、跨境电商感兴趣';
  const excludeLine = prefs.excludeKeywords.length
    ? `用户不感兴趣的主题：${prefs.excludeKeywords.join('、')}`
    : '';

  const newsBlock = items.map((n, i) =>
    `[${i}] 标题: ${n.title}${n.summary ? `\n    摘要: ${n.summary.slice(0, 100)}` : ''}`
  ).join('\n');

  return `你是一位新闻助理。请根据用户兴趣对下列新闻打分。

${interestLine}
${excludeLine}

新闻列表（共${items.length}条）：
${newsBlock}

请以 JSON 数组格式返回，每个元素包含：
- index: 序号（0开始）
- score: 相关度评分 0-10（0=完全无关，10=极度相关）
- recommended: 是否重点推荐（score>=8 时为 true）
- reason: 一句话说明（10字以内，如"大模型新动态"，不相关则为空字符串）

只返回 JSON 数组，不要其他内容。`;
}

export async function scoreNewsBatch(
  items: NewsRawItem[],
  prefs: NewsPreferences,
  config: AiConfig
): Promise<AiScoreResult[]> {
  if (!config.apiKey || items.length === 0) {
    return items.map(n => ({ id: n.id, score: 5, recommended: false, reason: '' }));
  }

  const batches: NewsRawItem[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  const allResults: AiScoreResult[] = [];
  for (const batch of batches) {
    const results = await scoreBatch(batch, prefs, config);
    allResults.push(...results);
  }
  return allResults;
}

async function scoreBatch(
  batch: NewsRawItem[],
  prefs: NewsPreferences,
  config: AiConfig
): Promise<AiScoreResult[]> {
  const {
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    modelName = 'gpt-3.5-turbo',
  } = config;

  const prompt = buildScoringPrompt(batch, prefs);
  try {
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error(`AI API ${res.status}`);
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text: string = data.choices?.[0]?.message?.content ?? '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const raw: { index: number; score: number; recommended: boolean; reason: string }[] =
      JSON.parse(jsonMatch?.[0] ?? '[]');

    return batch.map((n, i) => {
      const r = raw.find(x => x.index === i);
      return {
        id: n.id,
        score: r ? Math.max(0, Math.min(10, r.score)) : 5,
        recommended: r?.recommended ?? false,
        reason: r?.reason ?? '',
      };
    });
  } catch (err) {
    console.error('[newsScorer] AI打分失败:', err);
    return batch.map(n => ({ id: n.id, score: 5, recommended: false, reason: '' }));
  }
}
