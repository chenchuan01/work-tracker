import dayjs from 'dayjs';
import { jsonStorage } from '../utils/jsonStorage';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: 'ai' | 'xiaomi' | 'general' | 'technology';
  publishedAt: string;
  keywords?: string[];  // AI 主题关键字
}

// 默认新闻数据（当 news-collector 不可用时使用）
// 注意：这些是示例数据，用于演示功能。要获取真实新闻，请配置 news-collector 并运行 npm run news:fetch
const DEFAULT_NEWS: NewsItem[] = [
  // 新浪新闻 - general
  {
    id: 'sina-1',
    title: '2026 年全国两会今日开幕',
    summary: '十四届全国人大四次会议和全国政协十四届三次会议分别于今日和明日开幕。',
    url: 'https://news.sina.com.cn/',
    source: '新浪新闻',
    category: 'general',
    publishedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'sina-2',
    title: '央行宣布降准 0.5 个百分点',
    summary: '中国人民银行决定于 2026 年 3 月 15 日下调金融机构存款准备金率 0.5 个百分点。',
    url: 'https://finance.sina.com.cn/',
    source: '新浪新闻',
    category: 'general',
    publishedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'sina-3',
    title: '春运今日正式启动 预计发送旅客 30 亿人次',
    summary: '2026 年春运今日正式启动，预计全国铁路、公路、水路、民航共发送旅客 30 亿人次。',
    url: 'https://news.sina.com.cn/',
    source: '新浪新闻',
    category: 'general',
    publishedAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'sina-4',
    title: '2026 年 GDP 增长目标设定为 5% 左右',
    summary: '国务院总理在政府工作报告中提出，2026 年国内生产总值增长目标为 5% 左右。',
    url: 'https://news.sina.com.cn/',
    source: '新浪新闻',
    category: 'general',
    publishedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  
  // 雷军微博 - xiaomi
  {
    id: 'weibo-1',
    title: '雷军：小米汽车工厂二期即将开工',
    summary: '雷军在微博宣布，小米汽车工厂二期即将开工，预计年产能将提升至 30 万辆。',
    url: 'https://weibo.com/u/1749127163',
    source: '雷军微博',
    category: 'xiaomi',
    publishedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'weibo-2',
    title: '雷军：小米 15 Ultra 销量破纪录',
    summary: '雷军在微博透露，小米 15 Ultra 开售首周销量突破 50 万台，创小米高端手机新纪录。',
    url: 'https://weibo.com/u/1749127163',
    source: '雷军微博',
    category: 'xiaomi',
    publishedAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'weibo-3',
    title: '雷军：感谢米粉支持，小米将继续坚持性价比',
    summary: '雷军在微博发文感谢米粉支持，表示小米将继续坚持性价比路线，为用户带来更多好产品。',
    url: 'https://weibo.com/u/1749127163',
    source: '雷军微博',
    category: 'xiaomi',
    publishedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'weibo-4',
    title: '雷军：小米 SU7 Ultra 刷新纽北最快四门车圈速',
    summary: '雷军宣布小米 SU7 Ultra 以 6 分 46 秒 874 的成绩刷新纽北赛道四门车圈速纪录。',
    url: 'https://weibo.com/u/1749127163',
    source: '雷军微博',
    category: 'xiaomi',
    publishedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  
  // 科技新闻 - technology (包含 AI 主题)
  {
    id: 'tech-1',
    title: '字节跳动发布新一代大模型豆包 2.0，AI 能力全面升级',
    summary: '字节跳动正式发布豆包 2.0 大模型，在多项基准测试中超越 GPT-4，AI 推理能力提升 40%。',
    url: 'https://36kr.com/',
    source: '36 氪',
    category: 'technology',
    publishedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', '大模型', '豆包', 'GPT', '人工智能', '深度学习'],
  },
  {
    id: 'tech-2',
    title: 'iOS 18.4 正式版发布，Apple Intelligence AI 功能亮相',
    summary: '苹果正式发布 iOS 18.4 正式版，新增 AI 助手、智能摘要等 AI 功能，Siri 理解能力大幅提升。',
    url: 'https://sspai.com/',
    source: '少数派',
    category: 'technology',
    publishedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', 'Apple Intelligence', 'Siri', '人工智能', 'iOS', '苹果'],
  },
  {
    id: 'tech-3',
    title: '百度发布文心一言 5.0，AI 多模态能力新突破',
    summary: '百度正式发布文心一言 5.0，支持多模态理解和生成能力，AI 绘画、AI 写作功能全面升级。',
    url: 'https://36kr.com/',
    source: '36 氪',
    category: 'technology',
    publishedAt: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', '文心一言', '百度', '大模型', '人工智能', '多模态'],
  },
  {
    id: 'tech-4',
    title: '英伟达发布 RTX 5090 显卡，AI 算力提升 3 倍',
    summary: '英伟达正式发布 RTX 5090 显卡，搭载新一代 AI 张量核心，深度学习性能较 RTX 4090 提升 60%。',
    url: 'https://www.expreview.com/',
    source: '超能网',
    category: 'technology',
    publishedAt: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', '英伟达', 'RTX 5090', '显卡', '深度学习', '张量核心'],
  },
  {
    id: 'tech-5',
    title: '华为发布鸿蒙 HarmonyOS 4.0，AI 分布式能力升级',
    summary: '华为正式发布鸿蒙 HarmonyOS 4.0，支持更多设备和应用场景，AI 智慧互联体验全面优化。',
    url: 'https://www.huawei.com/',
    source: '华为',
    category: 'technology',
    publishedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', '华为', '鸿蒙', 'HarmonyOS', '人工智能', '分布式'],
  },
  {
    id: 'tech-6',
    title: 'OpenAI 发布 GPT-5 预览版，AI 推理能力新里程碑',
    summary: 'OpenAI 正式发布 GPT-5 预览版，在数学推理、代码生成等 AI 任务上表现卓越，AGI 又近一步。',
    url: 'https://openai.com/blog',
    source: 'OpenAI',
    category: 'technology',
    publishedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', 'GPT-5', 'OpenAI', '大模型', '人工智能', 'AGI', '代码生成'],
  },
  {
    id: 'tech-7',
    title: 'Google DeepMind 发布 AlphaCode 2，AI 编程超越 95% 人类程序员',
    summary: 'Google DeepMind 新一代 AI 编程系统 AlphaCode 2 发布，在代码生成、调试任务上表现优异。',
    url: 'https://deepmind.google/',
    source: 'DeepMind',
    category: 'technology',
    publishedAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', 'AlphaCode', 'DeepMind', 'Google', '代码生成', '人工智能', '编程'],
  },
  {
    id: 'tech-8',
    title: 'Anthropic 推出 Claude 3.5，AI 上下文窗口达 1M tokens',
    summary: 'Anthropic 发布 Claude 3.5，支持超长上下文处理，AI 可一次性分析整本小说或大型代码库。',
    url: 'https://www.anthropic.com/',
    source: 'Anthropic',
    category: 'technology',
    publishedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    keywords: ['AI', 'Claude', 'Anthropic', '大模型', '人工智能', '上下文'],
  },
];

// 从 news-collector 数据目录加载新闻数据
const loadNewsFromCollector = async (): Promise<NewsItem[]> => {
  try {
    // 尝试从 jsonStorage 加载缓存的新闻数据
    const saved = await jsonStorage.getItem<NewsItem[]>('news_collector_items');
    if (saved && saved.length > 0) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load news from storage', e);
  }
  // 如果没有缓存，返回默认数据
  return DEFAULT_NEWS;
};

// 保存新闻到 jsonStorage
const saveNewsToStorage = async (items: NewsItem[]) => {
  await jsonStorage.setItem('news_collector_items', items);
};

// 从 news-collector 加载的所有新闻
let COLLECTOR_NEWS: NewsItem[] = DEFAULT_NEWS;

// 初始化新闻数据
export const initNewsData = async () => {
  COLLECTOR_NEWS = await loadNewsFromCollector();
};

// 立即初始化
initNewsData();

// 从 news-collector 数据文件加载新闻（需要在构建时或运行时注入）
export const loadNewsData = (newsItems: NewsItem[]) => {
  COLLECTOR_NEWS = newsItems;
  saveNewsToStorage(newsItems);
};

// 获取所有可用新闻（按发布时间倒序排序）
const getAllNews = (): NewsItem[] => {
  // 按发布日期倒序排序（最新的在前）
  return [...COLLECTOR_NEWS].sort((a, b) => {
    const dateA = dayjs(a.publishedAt).valueOf();
    const dateB = dayjs(b.publishedAt).valueOf();
    return dateB - dateA;
  });
};

// 检查新闻是否包含 AI 主题关键字
const hasAiKeyword = (news: NewsItem, keywords: string[]): boolean => {
  const searchText = `${news.title} ${news.summary} ${(news.keywords || []).join(' ')}`.toLowerCase();
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
};

// 按关键字搜索新闻
export const searchNewsByKeywords = (keywords: string[], category?: 'ai' | 'xiaomi' | 'general' | 'technology' | 'all'): NewsItem[] => {
  let news = getAllNews();
  
  // 按分类过滤
  if (category && category !== 'all') {
    news = news.filter(n => n.category === category);
  }
  
  // 按关键字过滤
  return news.filter(n => hasAiKeyword(n, keywords));
};

// ==================== 看过状态管理 ====================
// 获取已看过的新闻 ID 列表
export const getWatchedNewsIds = async (): Promise<string[]> => {
  const saved = await jsonStorage.getItem<string[]>('news_watched_ids');
  return saved || [];
};

// 保存已看过的新闻 ID
export const saveWatchedNewsIds = async (ids: string[]) => {
  await jsonStorage.setItem('news_watched_ids', ids);
};

// 标记新闻为已看过
export const markNewsAsWatched = async (id: string) => {
  const watchedIds = await getWatchedNewsIds();
  if (!watchedIds.includes(id)) {
    watchedIds.push(id);
    await saveWatchedNewsIds(watchedIds);
  }
};

// ==================== 新闻队列管理 ====================
// 获取新闻队列
export const getNewsQueue = async (): Promise<NewsItem[]> => {
  const saved = await jsonStorage.getItem<NewsItem[]>('news_queue');
  return saved || [];
};

// 保存新闻队列
export const saveNewsQueue = async (queue: NewsItem[]) => {
  await jsonStorage.setItem('news_queue', queue);
};

// 从队列中移除新闻
export const removeFromQueue = async (id: string) => {
  const queue = await getNewsQueue();
  const newQueue = queue.filter(n => n.id !== id);
  await saveNewsQueue(newQueue);
};

// 初始化或补充新闻队列（默认 20 条）
export const initializeOrRefillQueue = async (queueSize: number = 20): Promise<NewsItem[]> => {
  const queue = await getNewsQueue();
  const watchedIds = await getWatchedNewsIds();

  // 如果队列充足，直接返回
  if (queue.length >= queueSize) {
    return queue;
  }

  // 获取所有新闻（排除已看过的）
  const allNews = getAllNews();
  const availableNews = allNews.filter(news => !watchedIds.includes(news.id));

  // 补充队列到指定数量
  const neededCount = queueSize - queue.length;
  const newsToAdd = availableNews.slice(0, neededCount);

  // 合并现有队列和新新闻（避免重复）
  const existingIds = new Set(queue.map(n => n.id));
  const newQueue = [...queue, ...newsToAdd.filter(n => !existingIds.has(n.id))];

  await saveNewsQueue(newQueue);
  return newQueue;
};

// 获取近 3 天的新闻（带分类过滤，从队列中获取）
export const getRecentNews = async (category?: 'ai' | 'xiaomi' | 'general' | 'technology' | 'all', queueSize: number = 20): Promise<NewsItem[]> => {
  // 初始化或补充队列
  const queue = await initializeOrRefillQueue(queueSize);

  // 按分类过滤
  if (category && category !== 'all') {
    return queue.filter(n => n.category === category);
  }
  return queue;
};

// 获取新闻列表（兼容旧接口）
export const getNewsList = async (
  category?: 'ai' | 'xiaomi' | 'general' | 'technology' | 'all',
  limit: number = 6,
  queueSize: number = 20
): Promise<NewsItem[]> => {
  const recentNews = await getRecentNews(category, queueSize);
  return recentNews.slice(0, limit);
};

// 获取下一条未展示的新闻（点击"看过"后调用）
export const getNextNewsFromQueue = async (
  currentId: string,
  category?: 'ai' | 'xiaomi' | 'general' | 'technology' | 'all'
): Promise<NewsItem | null> => {
  // 先标记当前新闻为已看过
  await markNewsAsWatched(currentId);

  // 从队列中移除
  await removeFromQueue(currentId);

  // 补充队列
  const queue = await initializeOrRefillQueue(20);

  // 按分类过滤获取第一条
  if (category && category !== 'all') {
    return queue.find(n => n.category === category) || null;
  }
  return queue[0] || null;
};

// 获取最后一次刷新时间
export const getLastRefreshTime = async (): Promise<number> => {
  const saved = await jsonStorage.getItem<number>('news_last_refresh');
  return saved || 0;
};

// 保存刷新时间
export const saveRefreshTime = async (timestamp: number) => {
  await jsonStorage.setItem('news_last_refresh', timestamp);
};

// 刷新新闻数据（从 collector 重新加载）
export const refreshNewsFromCollector = async () => {
  const news = await loadNewsFromCollector();
  if (news.length > 0) {
    COLLECTOR_NEWS = news;
    // 重置队列
    await jsonStorage.removeItem('news_queue');
    await initializeOrRefillQueue(20);
  }
  return news;
};
