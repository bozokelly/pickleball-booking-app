'use client';

import { useEffect } from 'react';
import { useFeedStore } from '@/stores/feedStore';
import { supabase } from '@/lib/supabase';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import HomeWidgets from '@/components/home/HomeWidgets';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { posts, loading, hasMore, fetchPosts } = useFeedStore();

  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('feed_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        () => {
          fetchPosts(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        () => {
          fetchPosts(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Home</h1>

      <HomeWidgets />

      <PostComposer />

      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchPosts()}
                loading={loading}
              >
                Load More
              </Button>
            </div>
          )}

          {loading && posts.length === 0 && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
