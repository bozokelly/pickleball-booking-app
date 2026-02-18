'use client';

import { useLinkPreview } from '@/hooks/useLinkPreview';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const { data, loading, error } = useLinkPreview(url);

  if (loading) {
    return (
      <div className="border border-border/50 rounded-xl p-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-background rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-background rounded w-3/4" />
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    // Graceful fallback: just show the URL as a link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
      >
        <ExternalLink className="h-4 w-4 flex-shrink-0" />
        {url}
      </a>
    );
  }

  // Don't render if there's no meaningful data
  if (!data.title && !data.description && !data.image) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
      >
        <ExternalLink className="h-4 w-4 flex-shrink-0" />
        {url}
      </a>
    );
  }

  const domain = (() => {
    try {
      return data.siteName || new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors group"
    >
      <div className="flex">
        {data.image && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 p-3 space-y-1">
          <p className="text-xs text-text-tertiary uppercase tracking-wide">{domain}</p>
          {data.title && (
            <p className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
              {data.title}
            </p>
          )}
          {data.description && (
            <p className="text-xs text-text-secondary line-clamp-2">{data.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}
