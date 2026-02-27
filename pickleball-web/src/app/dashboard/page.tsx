'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useFeedStore } from '@/stores/feedStore';
import { supabase } from '@/lib/supabase';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import HomeWidgets from '@/components/home/HomeWidgets';
import { Button } from '@/components/ui';
import { Club } from '@/types/database';
import { Loader2, MapPin } from 'lucide-react';

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

      {myClubs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Find your pickleball community</h2>
          <p className="text-text-secondary text-sm max-w-xs mb-6">
            Join a local club to see games, news, and connect with players near you.
          </p>
          <Link
            href="/dashboard/games"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all duration-150 shadow-[0_1px_4px_rgba(79,111,163,0.30)]"
          >
            Find a Club
          </Link>
        </div>
      )}

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
