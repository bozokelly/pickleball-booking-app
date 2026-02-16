'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui';
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

export default function NewsPage() {
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
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Pickleball News</h1>
        <p className="text-sm text-text-tertiary mt-0.5">
          Latest stories from the world of pickleball
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse">
                <div className="h-48 bg-background" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-background rounded w-3/4" />
                  <div className="h-4 bg-background rounded w-full" />
                  <div className="h-4 bg-background rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : news.length === 0 ? (
        <Card className="p-12 text-center">
          <Newspaper className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No news articles available right now</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                {item.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.categories.length > 0 && (
                      <span className="absolute top-3 left-3 text-[11px] font-semibold text-white bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        {item.categories[0]}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <h2 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {!item.image && item.categories.length > 0 && (
                        <span className="text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                          {item.categories[0]}
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary">
                        {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : ''}
                      </span>
                      {item.creator && (
                        <span className="text-xs text-text-tertiary">
                          by {item.creator}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      <div className="text-center pb-4">
        <a
          href="https://thedinkpickleball.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-tertiary hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          Powered by The Dink Pickleball <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
