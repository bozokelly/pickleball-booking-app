'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image: string | null;
  creator: string | null;
  categories: string[];
}

export default function NewsWidget({ compact = false }: { compact?: boolean }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch {
        // Silently fail — news is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    if (compact) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-background rounded w-full mb-1" />
              <div className="h-2 bg-background rounded w-2/3" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="h-5 w-5 text-text-tertiary" />
          <h2 className="text-lg font-semibold text-text-primary">Pickleball News</h2>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-border/50">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-background rounded w-3/4" />
                <div className="h-3 bg-background rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  // Compact sidebar version
  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Newspaper className="h-3.5 w-3.5 text-text-tertiary" />
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">News</span>
          </div>
          <a
            href="https://thedinkpickleball.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-text-tertiary hover:text-primary transition-colors"
          >
            The Dink
          </a>
        </div>
        <div className="space-y-1">
          {news.slice(0, 5).map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1.5 rounded-lg hover:bg-background transition-colors group"
            >
              <p className="text-xs font-medium text-text-secondary group-hover:text-primary line-clamp-2 leading-snug">
                {item.title}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : ''}
              </p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Full version (for pages)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-text-tertiary" />
          <h2 className="text-lg font-semibold text-text-primary">Pickleball News</h2>
        </div>
        <a
          href="https://thedinkpickleball.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-tertiary hover:text-primary transition-colors flex items-center gap-1"
        >
          via The Dink <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-2">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="p-4 bg-white rounded-xl border border-border/50 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary line-clamp-2">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.categories.length > 0 && (
                      <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">
                        {item.categories[0]}
                      </span>
                    )}
                    <span className="text-xs text-text-tertiary">
                      {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
