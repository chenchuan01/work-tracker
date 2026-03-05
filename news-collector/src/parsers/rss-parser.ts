/**
 * RSS 解析器模块
 * 支持解析标准 RSS 2.0 和 Atom 1.0 格式
 */

import { XMLParser } from 'fast-xml-parser';
import type { NewsItem } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface RSSItem {
  title?: string;
  link?: string | { _text?: string; _attributes?: { href?: string } };
  description?: string;
  content?: string | { _text?: string };
  pubDate?: string;
  updated?: string;
  author?: string | { name?: string };
  'dc:creator'?: string;
  'media:content'?: { _attributes?: { url?: string } };
  enclosure?: { _attributes?: { url?: string } };
  guid?: string | { _text: string };
  category?: string | string[];
}

interface RSSFeed {
  channel?: {
    title?: string;
    link?: string;
    description?: string;
    item?: RSSItem | RSSItem[];
  };
  entry?: RSSItem | RSSItem[];
}

export class RSSParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * 解析 RSS/Atom XML 内容
   */
  parse(xml: string, sourceId: string, sourceName: string, category: string, language: string): NewsItem[] {
    try {
      const result = this.parser.parse(xml) as RSSFeed;
      const items: RSSItem[] = [];

      // 处理 RSS 2.0 格式
      if (result.channel?.item) {
        const channelItems = Array.isArray(result.channel.item) 
          ? result.channel.item 
          : [result.channel.item];
        items.push(...channelItems);
      }

      // 处理 Atom 1.0 格式
      if (result.entry) {
        const entries = Array.isArray(result.entry) 
          ? result.entry 
          : [result.entry];
        items.push(...entries);
      }

      return items
        .filter((item): item is RSSItem & { title: string } => {
          const title = this.extractTitle(item);
          if (!title) {
            logger.warn('Skipping item without title', sourceId);
            return false;
          }
          return true;
        })
        .map((item) => this.convertToNewsItem(item, sourceId, sourceName, category, language));
    } catch (error) {
      logger.error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`, sourceId);
      throw error;
    }
  }

  private extractTitle(item: RSSItem): string | undefined {
    return typeof item.title === 'string' ? item.title : undefined;
  }

  private extractLink(item: RSSItem): string | undefined {
    if (typeof item.link === 'string') {
      return item.link;
    }
    if (typeof item.link === 'object' && item.link) {
      return item.link._text || item.link._attributes?.href;
    }
    return undefined;
  }

  private extractDescription(item: RSSItem): string {
    return item.description || 
           (typeof item.content === 'string' ? item.content : item.content?._text) || 
           '';
  }

  private extractPubDate(item: RSSItem): Date {
    const dateStr = item.pubDate || item.updated;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  }

  private extractAuthor(item: RSSItem): string | undefined {
    if (typeof item.author === 'string') {
      return item.author;
    }
    if (typeof item.author === 'object' && item.author?.name) {
      return item.author.name;
    }
    return item['dc:creator'];
  }

  private extractImageUrl(item: RSSItem): string | undefined {
    // 检查 media:content
    if (item['media:content']?._attributes?.url) {
      return item['media:content']._attributes.url;
    }
    // 检查 enclosure
    if (item.enclosure?._attributes?.url) {
      return item.enclosure._attributes.url;
    }
    // 从描述中提取图片
    const description = this.extractDescription(item);
    const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
    return undefined;
  }

  private extractTags(item: RSSItem): string[] {
    if (!item.category) return [];
    const categories = Array.isArray(item.category) ? item.category : [item.category];
    return categories.filter((cat): cat is string => typeof cat === 'string');
  }

  private convertToNewsItem(
    item: RSSItem,
    sourceId: string,
    sourceName: string,
    category: string,
    language: string
  ): NewsItem {
    const title = this.extractTitle(item) as string;
    const link = this.extractLink(item) || '';
    const pubDate = this.extractPubDate(item);
    
    // 生成唯一 ID（使用 hash）
    const hash = this.generateHash(title, link, pubDate);

    return {
      id: hash,
      title: this.stripHtml(title),
      link,
      description: this.stripHtml(this.extractDescription(item)),
      content: undefined,
      pubDate,
      author: this.extractAuthor(item),
      source: sourceName,
      sourceId,
      category,
      language,
      imageUrl: this.extractImageUrl(item),
      tags: this.extractTags(item),
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

export const rssParser = new RSSParser();
