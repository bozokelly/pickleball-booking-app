'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { useAuthStore } from '@/stores/authStore';
import { Club, Game } from '@/types/database';
import { format, addDays } from 'date-fns';
import { Button, Card, Badge, MarkdownRenderer } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft, MapPin, Users, Loader2, Mail, Phone,
  UserCircle, Navigation, ExternalLink, Send, LogOut, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useClubMessageStore } from '@/stores/clubMessageStore';
import { useFeedStore } from '@/stores/feedStore';
import Image from 'next/image';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/lib/supabase';

interface AdminInfo {
  user_id: string;
  role: string;
}

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { fetchClubById, isClubAdmin } = useClubStore();
  const { getMembershipStatus, requestMembership, leaveClub, fetchMyMemberships } = useMembershipStore();
  const { showToast } = useToast();

  const [club, setClub] = useState<Club | null>(null);
  const [games, setGames] = useState<(Game & { confirmed_count: number })[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date().toISOString();
        const nextWeek = addDays(new Date(), 7).toISOString();

        const [clubData, , memberResult, adminResult, gamesResult] = await Promise.all([
          fetchClubById(clubId),
          fetchMyMemberships(),
          supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)
            .eq('status', 'approved'),
          supabase
            .from('club_admins')
            .select('user_id, role, profile:profiles!club_admins_user_id_fkey(full_name)')
            .eq('club_id', clubId)
            .eq('role', 'owner')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('games')
            .select('*, club:clubs(*)')
            .eq('club_id', clubId)
            .eq('status', 'upcoming')
            .gte('date_time', now)
            .lte('date_time', nextWeek)
            .or(`visible_from.is.null,visible_from.lte.${now}`)
            .order('date_time', { ascending: true })
            .limit(7),
        ]);

        setClub(clubData);
        setMemberCount(memberResult.count || 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ownerProfile = (adminResult.data as any)?.profile;
        setManagerName(ownerProfile?.full_name || null);

        const gameData = gamesResult.data;
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

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveClub(clubId);
      showToast('You have left the club', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to leave club';
      showToast(message, 'error');
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
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
        <div className="rounded-2xl overflow-hidden aspect-[3/1] relative">
          <Image src={club.image_url} alt={club.name} fill className="object-cover" />
        </div>
      )}

      {/* Club name + badges */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{club.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
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
      </div>

      {/* Info bar */}
      <Card className="px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {managerName && (
            <div className="flex items-center gap-2 text-text-primary">
              <UserCircle className="h-4 w-4 text-text-tertiary" />
              <span className="text-text-secondary">Manager:</span>
              <span className="font-medium">{managerName}</span>
            </div>
          )}
          {club.contact_phone && (
            <a href={`tel:${club.contact_phone}`} className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="h-4 w-4" />
              {club.contact_phone}
            </a>
          )}
          {club.contact_email && (
            <a href={`mailto:${club.contact_email}`} className="flex items-center gap-2 text-primary hover:underline">
              <Mail className="h-4 w-4" />
              {club.contact_email}
            </a>
          )}
          <div className="flex items-center gap-2 text-text-primary">
            <Users className="h-4 w-4 text-text-tertiary" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
          {club.location && (
            <div className="flex items-center gap-2 text-text-primary">
              <MapPin className="h-4 w-4 text-text-tertiary" />
              <span className="truncate max-w-[200px]">{club.location}</span>
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                <Navigation className="h-3 w-3" />
                Directions
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Description */}
      {club.description && (
        <Card className="p-5">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">About</h2>
          <MarkdownRenderer content={club.description} />
        </Card>
      )}

      {/* Upcoming Games */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Upcoming Games</h2>
        {games.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-tertiary text-sm">No games scheduled this week</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {games.map((game) => {
              const isFull = (game.confirmed_count || 0) >= game.max_spots;
              return (
                <Link key={game.id} href={`/dashboard/game/${game.id}`}>
                  <Card className="p-3.5 hover:shadow-md transition-shadow cursor-pointer space-y-2 h-full">
                    <p className="text-xs font-semibold text-text-primary truncate">{game.title}</p>
                    <div>
                      <p className="text-[11px] font-medium text-text-secondary">
                        {format(new Date(game.date_time), 'EEE d MMM')}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
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

      {/* Join / Leave / Pending */}
      {!isAdmin && (
        <div>
          {!membershipStatus && (
            <Button onClick={handleJoin} loading={joining} className="w-full" icon={<Users className="h-4 w-4" />}>
              Join Club
            </Button>
          )}
          {membershipStatus === 'pending' && (
            <Button disabled className="w-full" variant="outline">
              Membership Request Pending
            </Button>
          )}
          {membershipStatus === 'approved' && (
            <Button
              variant="outline"
              className="w-full text-red-500 border-red-200 hover:bg-red-50"
              icon={<LogOut className="h-4 w-4" />}
              onClick={() => setShowLeaveDialog(true)}
              loading={leaving}
            >
              Leave Club
            </Button>
          )}
        </div>
      )}

      {/* Members list */}
      {(membershipStatus === 'approved' || isAdmin) && (
        <ClubMembers clubId={clubId} />
      )}

      {/* Contact Club (collapsed) */}
      {!isAdmin && (membershipStatus === 'approved' || !club.members_only) && (
        <ContactClubForm clubId={clubId} />
      )}

      {/* Club Feed */}
      {(membershipStatus === 'approved' || isAdmin) && (
        <ClubFeed clubId={clubId} />
      )}

      <ConfirmDialog
        open={showLeaveDialog}
        title="Leave Club"
        message="Are you sure you want to leave this club? You will need to request membership again to rejoin."
        confirmLabel="Leave Club"
        variant="danger"
        onConfirm={handleLeave}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}

function ClubMembers({ clubId }: { clubId: string }) {
  const [members, setMembers] = useState<{ user_id: string; full_name: string | null; avatar_url: string | null; role: string | null }[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const [membersResult, adminsResult] = await Promise.all([
        supabase
          .from('club_members')
          .select('user_id, profile:profiles!club_members_user_id_fkey(full_name, avatar_url)')
          .eq('club_id', clubId)
          .eq('status', 'approved')
          .order('requested_at', { ascending: true }),
        supabase
          .from('club_admins')
          .select('user_id, role')
          .eq('club_id', clubId),
      ]);

      const adminList = adminsResult.data || [];
      setAdmins(adminList);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberList = (membersResult.data || []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profile?.full_name || null,
        avatar_url: m.profile?.avatar_url || null,
        role: adminList.find((a) => a.user_id === m.user_id)?.role || null,
      }));

      // Sort: owners first, then admins, then members
      memberList.sort((a: { role: string | null }, b: { role: string | null }) => {
        const order = (r: string | null) => r === 'owner' ? 0 : r === 'admin' ? 1 : 2;
        return order(a.role) - order(b.role);
      });

      setMembers(memberList);
      setLoading(false);
    }
    load();
  }, [clubId]);

  if (loading) return null;
  if (members.length === 0) return null;

  const PREVIEW_COUNT = 8;
  const visibleMembers = expanded ? members : members.slice(0, PREVIEW_COUNT);
  const hasMore = members.length > PREVIEW_COUNT;

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-3">Members ({members.length})</h2>
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleMembers.map((member) => (
            <div key={member.user_id} className="flex items-center gap-2.5 p-2 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <Users className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{member.full_name || 'Member'}</p>
                {member.role === 'owner' ? (
                  <p className="text-[10px] font-semibold text-purple-600">Owner</p>
                ) : member.role === 'admin' ? (
                  <p className="text-[10px] font-semibold text-orange-500">Admin</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 mx-auto"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all {members.length} members <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </Card>
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
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Send className="h-4 w-4" />
        Contact Club
      </button>
    );
  }

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
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={sending} icon={<Send className="h-4 w-4" />}>
            Send
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
