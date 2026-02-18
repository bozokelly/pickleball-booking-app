/**
 * Supabase Edge Function: Fetch Open Graph metadata from a URL for link previews.
 *
 * Accepts POST { url: string }, fetches the page HTML, parses OG tags,
 * caches the result in the link_previews table, and returns the metadata.
 *
 * Deploy: supabase functions deploy fetch-link-preview
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getMetaContent(html: string, property: string): string | null {
  // Match <meta property="og:xxx" content="..."> or <meta name="xxx" content="...">
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return jsonResponse({ error: 'Missing url parameter' }, 400);
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return jsonResponse({ error: 'Invalid URL protocol' }, 400);
      }
    } catch {
      return jsonResponse({ error: 'Invalid URL' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check cache first
    const { data: cached } = await supabase
      .from('link_previews')
      .select('*')
      .eq('url', url)
      .single();

    if (cached) {
      return jsonResponse({
        title: cached.title,
        description: cached.description,
        image: cached.image_url,
        siteName: cached.site_name,
        url: cached.url,
      });
    }

    // Fetch the URL with timeout and size limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let html: string;
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
          'Accept': 'text/html',
        },
      });

      if (!response.ok) {
        return jsonResponse({ error: `Failed to fetch URL: ${response.status}` }, 502);
      }

      // Limit to 5MB
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return jsonResponse({ error: 'Response too large' }, 502);
      }

      html = await response.text();
      // Only parse the first 100KB for meta tags
      html = html.substring(0, 100_000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      return jsonResponse({ error: message }, 502);
    } finally {
      clearTimeout(timeout);
    }

    // Parse OG tags, fallback to standard meta tags
    const title = getMetaContent(html, 'og:title') || getTitle(html);
    const description = getMetaContent(html, 'og:description') || getMetaContent(html, 'description');
    const image = getMetaContent(html, 'og:image');
    const siteName = getMetaContent(html, 'og:site_name');

    const preview = { title, description, image, siteName, url };

    // Cache in database (best-effort, don't fail if insert fails)
    await supabase.from('link_previews').upsert({
      url,
      title,
      description,
      image_url: image,
      site_name: siteName,
    });

    return jsonResponse(preview);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});
