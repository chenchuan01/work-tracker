export const buildSummaryPrompt = (
  records: string[],
  dateRange: string,
  systemPrompt?: string,
  viewType?: 'day' | 'week' | 'month'
): string => {
  const recordsText = records.map(r => `- ${r}`).join('\n');

  const maxWords = viewType === 'week' || viewType === 'month' ? 1000 : 100;
  const defaultSystemPrompt = `你是一位专业的工作助理，请根据用户提供的工作记录，生成一份精炼的工作简报。

【要求】
1. 字数严格控制在 ${maxWords} 字以内（中文字符）
2. 语言简洁专业，适合工作汇报
3. 突出重点工作成果
4. 使用 Markdown 格式输出，可适当使用标题、列表等结构
5. 使用连贯的语句，避免无意义罗列`;

  const systemInstruction = systemPrompt || defaultSystemPrompt;

  return `${systemInstruction}

【工作记录】
${recordsText}

【时间范围】
${dateRange}

【生成的简报】`;
};

export interface ModelConfig {
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
  systemPrompt?: string;
}

export const generateSummary = async (
  records: { content: string }[],
  dateRange: string,
  config?: ModelConfig,
  viewType?: 'day' | 'week' | 'month'
): Promise<string> => {
  const {
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    modelName = 'gpt-3.5-turbo',
    systemPrompt,
  } = config || {};

  // 如果没有配置 API Key，返回模拟数据
  if (!apiKey) {
    return simulateSummary(records);
  }

  const maxTokens = viewType === 'week' || viewType === 'month' ? 1500 : 200;
  const prompt = buildSummaryPrompt(records.map(r => r.content), dateRange, systemPrompt, viewType);

  try {
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('AI 请求失败');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '生成失败';
  } catch (error) {
    console.error('AI 总结失败:', error);
    return simulateSummary(records);
  }
};

const simulateSummary = (records: { content: string }[]): string => {
  const count = records.length;
  const items = records.slice(0, 5).map(r => r.content).join('、');
  const more = count > 5 ? `等${count}项工作` : '';
  return `本期完成${count}项工作：${items}${more}。`;
};
