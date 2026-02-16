'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { Club, Game } from '@/types/database';
import { format, addDays } from 'date-fns';
import { Button, Card, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft, MapPin, Users, Loader2, Mail, Phone, Globe,
  UserCircle, Send, Navigation, ExternalLink,
} from 'lucide-react';
import { useClubMessageStore } from '@/stores/clubMessageStore';
import { useFeedStore } from '@/stores/feedStore';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { fetchClubById, isClubAdmin } = useClubStore();
  const { getMembershipStatus, requestMembership, fetchMyMemberships } = useMembershipStore();
  const { showToast } = useToast();

  const [club, setClub] = useState<Club | null>(null);
  const [games, setGames] = useState<(Game & { confirmed_count: number })[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { supabase } = await import('@/lib/supabase');
        const [clubData] = await Promise.all([
          fetchClubById(clubId),
          fetchMyMemberships(),
        ]);
        setClub(clubData);

        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubId)
          .eq('status', 'approved');
        setMemberCount(count || 0);

        const { data: adminData } = await supabase
          .from('club_admins')
          .select('user_id, role')
          .eq('club_id', clubId)
          .eq('role', 'owner')
          .limit(1)
          .single();
        if (adminData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', adminData.user_id)
            .single();
          setManagerName(profileData?.full_name || null);
        }

        const now = new Date().toISOString();
        const nextWeek = addDays(new Date(), 7).toISOString();
        const { data: gameData } = await supabase
          .from('games')
          .select('*, club:clubs(*)')
          .eq('club_id', clubId)
          .eq('status', 'upcoming')
          .gte('date_time', now)
          .lte('date_time', nextWeek)
          .or(`visible_from.is.null,visible_from.lte.${now}`)
          .order('date_time', { ascending: true })
          .limit(7);

        if (gameData && gameData.length > 0) {
          const gameIds = gameData.map((g) => g.id);
          const { data: countData } = await supabase
            .from('bookings')
            .select('game_id')
            .in('game_id', gameIds)
            .eq('status', 'confirmed');
          const countMap: Record<string, number> = {};
          (countData || []).forEach((b) => {
            countMap[b.game_id] = (countMap[b.game_id] || 0) + 1;
          });
          setGames(gameData.map((g) => ({ ...g, confirmed_count: countMap[g.id] || 0 })));
        } else {
          setGames([]);
        }
      } catch {
        showToast('Failed to load club', 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const membershipStatus = getMembershipStatus(clubId);
  const isAdmin = isClubAdmin(clubId);
  const hasContact = club ? (club.contact_email || club.contact_phone || club.website) : false;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await requestMembership(clubId);
      showToast('Membership request sent!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to request membership';
      showToast(message, 'error');
    } finally {
      setJoining(false);
    }
  };

  const getDirectionsUrl = () => {
    if (!club) return '#';
    if (club.latitude && club.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`;
    }
    if (club.location) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club.location)}`;
    }
    return '#';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!club) {
    return <p className="text-center text-text-secondary py-12">Club not found</p>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero image */}
      {club.image_url && (
        <div className="rounded-2xl overflow-hidden aspect-[3/1]">
          <img src={club.image_url} alt={club.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Club name + badges */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{club.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge
            label={club.members_only ? 'Members Only' : 'Open Club'}
            color={club.members_only ? '#FF9500' : '#34C759'}
          />
          {isAdmin ? (
            <Badge label="Admin" color="#007AFF" />
          ) : membershipStatus === 'approved' ? (
            <Badge label="Member" color="#34C759" />
          ) : membershipStatus === 'pending' ? (
            <Badge label="Pending" color="#FF9500" />
          ) : membershipStatus === 'rejected' ? (
            <Badge label="Rejected" color="#FF3B30" />
          ) : null}
        </div>
        {!isAdmin && !membershipStatus && (
          <div className="mt-3">
            <Button onClick={handleJoin} loading={joining} size="sm" icon={<Users className="h-4 w-4" />}>
              Join Club
            </Button>
          </div>
        )}
      </div>

      {/* === Two-column layout: Games (left) + Info (right) === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left column — Next Week's Games (wider) */}
        <div className="lg:col-span-3 space-y-4" id="club-games">
          <h2 className="text-sm font-semibold text-text-secondary">Next Week&apos;s Games</h2>
          {games.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-text-tertiary text-sm">No games scheduled this week</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {games.map((game) => {
                const isFull = (game.confirmed_count || 0) >= game.max_spots;
                return (
                  <Link key={game.id} href={`/dashboard/game/${game.id}`}>
                    <Card className="p-3.5 hover:shadow-md transition-shadow cursor-pointer space-y-2 h-full">
                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {format(new Date(game.date_time), 'EEE d MMM')}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          {format(new Date(game.date_time), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {isFull ? (
                          <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Full</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            {game.max_spots - (game.confirmed_count || 0)} left
                          </span>
                        )}
                        {game.requires_dupr && (
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">DUPR</span>
                        )}
                      </div>
                      <div className={`text-[11px] font-semibold text-center py-1.5 rounded-lg ${isFull ? 'bg-orange-50 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                        {isFull ? 'Join Waitlist' : 'Book Now'}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — Club Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* About */}
          {club.description && (
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">About</h3>
              <p className="text-sm text-text-primary leading-relaxed">{club.description}</p>
            </Card>
          )}

          {/* Details card */}
          <Card className="p-4 space-y-3">
            {/* Members */}
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm text-text-primary">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>

            {/* Manager */}
            {managerName && (
              <div className="flex items-center gap-2.5">
                <UserCircle className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Manager: <span className="font-medium text-text-primary">{managerName}</span></span>
              </div>
            )}

            {/* Location + Directions */}
            {club.location && (
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-text-tertiary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{club.location}</p>
                  <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 mt-1"
                  >
                    <Navigation className="h-3 w-3" />
                    Get Directions
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            )}
          </Card>

          {/* Contact info */}
          {hasContact && (
            <Card className="p-4 space-y-2">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">Contact</h3>
              {club.contact_email && (
                <a href={`mailto:${club.contact_email}`} className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  {club.contact_email}
                </a>
              )}
              {club.contact_phone && (
                <a href={`tel:${club.contact_phone}`} className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {club.contact_phone}
                </a>
              )}
              {club.website && (
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                  <Globe className="h-4 w-4" />
                  {club.website}
                </a>
              )}
            </Card>
          )}

          {/* Contact Club form (non-admins) */}
          {!isAdmin && (
            <ContactClubForm clubId={clubId} />
          )}
        </div>
      </div>

      {/* Club Feed — full width below */}
      {(membershipStatus === 'approved' || isAdmin) && (
        <ClubFeed clubId={clubId} />
      )}
    </div>
  );
}

function ClubFeed({ clubId }: { clubId: string }) {
  const { posts, loading, hasMore, fetchPosts } = useFeedStore();

  useEffect(() => {
    fetchPosts(true, clubId);
  }, [clubId, fetchPosts]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-3">Club Discussion</h2>
      <div className="space-y-4">
        <PostComposer clubs={[]} fixedClubId={clubId} />
        {posts.length === 0 && !loading ? (
          <Card className="p-5">
            <p className="text-text-secondary text-center text-sm">No posts yet. Start the conversation!</p>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
        {hasMore && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={() => fetchPosts(false, clubId)} loading={loading}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactClubForm({ clubId }: { clubId: string }) {
  const { sendMessage } = useClubMessageStore();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      showToast('Please fill in subject and message', 'error');
      return;
    }
    setSending(true);
    try {
      await sendMessage(clubId, subject.trim(), body.trim());
      showToast('Message sent to club!', 'success');
      setSubject('');
      setBody('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Contact Club</h3>
      <form onSubmit={handleSend} className="space-y-2">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
        />
        <textarea
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none text-sm"
        />
        <Button type="submit" size="sm" loading={sending} icon={<Send className="h-4 w-4" />}>
          Send
        </Button>
      </form>
    </Card>
  );
}
