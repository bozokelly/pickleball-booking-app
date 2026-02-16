'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFeedStore } from '@/stores/feedStore';
import { supabase } from '@/lib/supabase';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import HomeWidgets from '@/components/home/HomeWidgets';
import { Button } from '@/components/ui';
import { Club } from '@/types/database';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { posts, loading, hasMore, fetchPosts } = useFeedStore();
  const [myClubs, setMyClubs] = useState<Club[]>([]);

  const handleClubsLoaded = useCallback((clubs: Club[]) => {
    setMyClubs(clubs);
  }, []);

  useEffect(() => {
    // Fetch all posts (no club filter = home feed showing all club posts)
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
      try { supabase.removeChannel(channel); } catch { /* ignore AbortError from StrictMode */ }
    };
  }, [fetchPosts]);

  return (
    <div className="space-y-6">
      <HomeWidgets onClubsLoaded={handleClubsLoaded} />

      {myClubs.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Club Feed</h2>
            <PostComposer clubs={myClubs} />
          </div>

          {posts.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-text-secondary text-sm">No posts yet. Be the first to share something with your clubs!</p>
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
        </>
      )}

    </div>
  );
}
