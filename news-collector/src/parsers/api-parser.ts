/**
 * API 响应解析器模块
 * 支持解析常见的新闻 API 响应格式
 */

import type { NewsItem } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface APIArticle {
  title?: string;
  url?: string;
  link?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  pubDate?: string;
  date?: string;
  author?: string;
  source?: { name?: string } | string;
  urlToImage?: string;
  imageUrl?: string;
  image?: string | { url?: string };
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export class APIParser {
  /**
   * 解析 API 响应数据
   */
  parse(
    data: unknown,
    sourceId: string,
    sourceName: string,
    category: string,
    language: string,
    responsePath?: string
  ): NewsItem[] {
    try {
      // 如果指定了响应路径，提取对应的数据
      let articles: APIArticle[] = [];
      
      if (responsePath) {
        const extracted = this.extractPath(data, responsePath);
        articles = Array.isArray(extracted) ? extracted : [];
      } else if (Array.isArray(data)) {
        articles = data;
      } else if (typeof data === 'object' && data !== null) {
        // 尝试常见的响应格式
        const obj = data as Record<string, unknown>;
        articles = Array.isArray(obj.articles) ? obj.articles :
                   Array.isArray(obj.items) ? obj.items :
                   Array.isArray(obj.data) ? obj.data :
                   Array.isArray(obj.results) ? obj.results : [];
      }

      return articles
        .filter((article): article is APIArticle & { title: string } => {
          const title = this.extractTitle(article);
          if (!title) {
            logger.warn('Skipping API item without title', sourceId);
            return false;
          }
          return true;
        })
        .map((article) => this.convertToNewsItem(article, sourceId, sourceName, category, language));
    } catch (error) {
      logger.error(`Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`, sourceId);
      throw error;
    }
  }

  /**
   * 从对象中提取指定路径的值
   */
  private extractPath(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }

  private extractTitle(article: APIArticle): string | undefined {
    return typeof article.title === 'string' ? article.title : undefined;
  }

  private extractLink(article: APIArticle): string | undefined {
    return article.url || article.link;
  }

  private extractDescription(article: APIArticle): string {
    return article.description || article.content || '';
  }

  private extractPubDate(article: APIArticle): Date {
    const dateStr = article.publishedAt || article.pubDate || article.date;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  }

  private extractAuthor(article: APIArticle): string | undefined {
    if (typeof article.author === 'string') {
      return article.author;
    }
    return undefined;
  }

  private extractImageUrl(article: APIArticle): string | undefined {
    if (article.urlToImage) return article.urlToImage;
    if (article.imageUrl) return article.imageUrl;
    if (typeof article.image === 'string') return article.image;
    if (typeof article.image === 'object' && article.image?.url) {
      return article.image.url;
    }
    return undefined;
  }

  private extractTags(article: APIArticle): string[] {
    if (Array.isArray(article.tags)) {
      return article.tags.filter((tag): tag is string => typeof tag === 'string');
    }
    return [];
  }

  private convertToNewsItem(
    article: APIArticle,
    sourceId: string,
    sourceName: string,
    category: string,
    language: string
  ): NewsItem {
    const title = this.extractTitle(article) as string;
    const link = this.extractLink(article) || '';
    const pubDate = this.extractPubDate(article);
    
    // 生成唯一 ID
    const hash = this.generateHash(title, link, pubDate);

    return {
      id: hash,
      title: this.stripHtml(title),
      link,
      description: this.stripHtml(this.extractDescription(article)),
      content: undefined,
      pubDate,
      author: this.extractAuthor(article),
      source: sourceName,
      sourceId,
      category,
      language,
      imageUrl: this.extractImageUrl(article),
      tags: this.extractTags(article),
      fetchedAt: new Date(),
      hash,
    };
  }

  /**
   * 生成唯一 hash
   */
  private generateHash(title: string, link: string, pubDate: Date): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${title}|${link}|${pubDate.toISOString()}`);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * 移除 HTML 标签
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const apiParser = new APIParser();
