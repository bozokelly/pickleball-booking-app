'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

interface UseLinkPreviewResult {
  data: LinkPreviewData | null;
  loading: boolean;
  error: boolean;
}

// In-memory session cache to avoid redundant requests
const previewCache = new Map<string, LinkPreviewData | null>();

export function useLinkPreview(url: string | null): UseLinkPreviewResult {
  const [data, setData] = useState<LinkPreviewData | null>(url ? previewCache.get(url) ?? null : null);
  const [loading, setLoading] = useState(url ? !previewCache.has(url) : false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    // Already cached in memory
    if (previewCache.has(url)) {
      setData(previewCache.get(url) ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    async function fetchPreview() {
      try {
        // First check the database cache
        const { data: cached } = await supabase
          .from('link_previews')
          .select('url, title, description, image_url, site_name')
          .eq('url', url!)
          .single();

        if (cached) {
          const preview: LinkPreviewData = {
            title: cached.title,
            description: cached.description,
            image: cached.image_url,
            siteName: cached.site_name,
            url: cached.url,
          };
          previewCache.set(url!, preview);
          if (!cancelled) {
            setData(preview);
            setLoading(false);
          }
          return;
        }

        // Not cached — call edge function to fetch + cache
        const { data: result, error: fnError } = await supabase.functions.invoke('fetch-link-preview', {
          body: { url },
        });

        if (fnError) throw fnError;

        if (result) {
          const preview: LinkPreviewData = {
            title: result.title || null,
            description: result.description || null,
            image: result.image || null,
            siteName: result.siteName || null,
            url: result.url || url!,
          };
          previewCache.set(url!, preview);
          if (!cancelled) {
            setData(preview);
            setLoading(false);
          }
        } else {
          previewCache.set(url!, null);
          if (!cancelled) {
            setData(null);
            setLoading(false);
            setError(true);
          }
        }
      } catch {
        previewCache.set(url!, null);
        if (!cancelled) {
          setData(null);
          setLoading(false);
          setError(true);
        }
      }
    }

    fetchPreview();
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
