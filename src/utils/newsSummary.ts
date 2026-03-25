export interface ModelConfig {
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
}

export interface NewsItem {
  title: string;
  url: string;
  summary?: string;
  source?: string;
}

// 新闻总结提示词
export const buildNewsSummaryPrompt = (news: NewsItem): string => {
  const newsInfo = `标题：${news.title}
来源：${news.source || '未知'}
链接：${news.url}
${news.summary ? `摘要：${news.summary}` : ''}`;

  return `你是一位专业的新闻分析师，请对以下新闻进行深度解读。

【新闻信息】
${newsInfo}

【请从以下角度分析】
1. **核心事件**：用一句话概括这条新闻的核心内容（20字以内）
2. **关键信息**：提炼3-5个关键要点
3. **背景分析**：这条新闻的背景和起因是什么？
4. **影响评估**：可能产生哪些影响？对相关行业/公司/个人意味着什么？
5. **延伸思考**：有什么值得进一步关注的点？

【输出要求】
- 使用 Markdown 格式
- 语言简洁专业，适合快速阅读
- 总字数控制在 300 字以内
- 直接输出分析内容，不要加前言后语`;
};

// 生成新闻总结
export const generateNewsSummary = async (
  news: NewsItem,
  config?: ModelConfig
): Promise<string> => {
  const {
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    modelName = 'gpt-3.5-turbo',
  } = config || {};

  if (!apiKey) {
    return '请先配置 AI API Key';
  }

  const prompt = buildNewsSummaryPrompt(news);

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
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('AI 请求失败');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '生成失败';
  } catch (error) {
    console.error('新闻总结失败:', error);
    return '生成失败，请检查网络连接或 API 配置';
  }
};
