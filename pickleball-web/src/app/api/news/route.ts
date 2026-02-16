import { NextResponse } from 'next/server';
import RSSParser from 'rss-parser';

const parser = new RSSParser();
const FEED_URL = 'https://thedinkpickleball.com/feed/';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

let cache: { data: NewsItem[]; timestamp: number } | null = null;

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image: string | null;
  creator: string | null;
  categories: string[];
}

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const feed = await parser.parseURL(FEED_URL);
    const items: NewsItem[] = (feed.items || []).slice(0, 8).map((item) => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      description: (item.contentSnippet || item.content?.replace(/<[^>]*>/g, '') || '').slice(0, 300).trim(),
      image: item.enclosure?.url || ((item as Record<string, any>)['media:content']?.['$']?.url as string) || null, // eslint-disable-line @typescript-eslint/no-explicit-any
      creator: item.creator || null,
      categories: item.categories?.slice(0, 3) || [],
    }));

    cache = { data: items, timestamp: Date.now() };
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
