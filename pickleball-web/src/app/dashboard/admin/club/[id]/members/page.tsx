'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMembershipStore } from '@/stores/membershipStore';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, User, Check, X, Shield, ShieldOff, UserMinus } from 'lucide-react';

interface AdminInfo {
  user_id: string;
  role: string;
}

export default function ClubMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { members, fetchClubMembers, approveMember, rejectMember, removeMember, promoteToAdmin, removeAdmin, loading } = useMembershipStore();
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchClubMembers(clubId);
    loadAdmins();
  }, [clubId, fetchClubMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAdmins() {
    const { data } = await supabase
      .from('club_admins')
      .select('user_id, role')
      .eq('club_id', clubId);
    setAdmins(data || []);
  }

  const getAdminRole = (userId: string) => admins.find((a) => a.user_id === userId)?.role || null;

  const pendingMembers = members.filter((m) => m.status === 'pending');
  const approvedMembers = members.filter((m) => m.status === 'approved');

  const handleApprove = async (memberId: string) => {
    try {
      await approveMember(memberId);
      showToast('Member approved', 'success');
      fetchClubMembers(clubId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      showToast(message, 'error');
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      await rejectMember(memberId);
      showToast('Request rejected', 'success');
      fetchClubMembers(clubId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject';
      showToast(message, 'error');
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      await removeMember(removeMemberId);
      showToast('Member removed', 'success');
      fetchClubMembers(clubId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      showToast(message, 'error');
    } finally {
      setRemoveMemberId(null);
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      await promoteToAdmin(clubId, userId);
      showToast('Promoted to admin', 'success');
      await loadAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to promote';
      showToast(message, 'error');
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      await removeAdmin(clubId, userId);
      showToast('Admin role removed', 'success');
      await loadAdmins();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to demote';
      showToast(message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-text-primary">Club Members</h1>

      {/* Pending requests */}
      {pendingMembers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Pending Requests ({pendingMembers.length})
          </h2>
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.profile?.avatar_url ? (
                        <Image src={member.profile.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{member.profile?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-text-secondary truncate">{member.profile?.email}</p>
                      {member.profile?.dupr_rating && (
                        <p className="text-xs text-text-tertiary">DUPR: {member.profile.dupr_rating}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <Button variant="primary" size="sm" icon={<Check className="h-4 w-4" />} onClick={() => handleApprove(member.id)}>
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" icon={<X className="h-4 w-4" />} onClick={() => handleReject(member.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved members */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Members ({approvedMembers.length})
        </h2>
        {approvedMembers.length === 0 ? (
          <p className="text-text-secondary text-sm">No approved members yet</p>
        ) : (
          <div className="space-y-2">
            {approvedMembers.map((member) => {
              const adminRole = getAdminRole(member.user_id);
              const isAdmin = !!adminRole;
              const isOwner = adminRole === 'owner';
              return (
                <Card key={member.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.profile?.avatar_url ? (
                        <Image src={member.profile.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">{member.profile?.full_name || 'Unknown'}</p>
                        {isOwner && <Badge label="Owner" color="#5856D6" />}
                        {isAdmin && !isOwner && <Badge label="Admin" color="#FF9500" />}
                        {!isAdmin && <Badge label="Member" color="#34C759" />}
                      </div>
                      <p className="text-xs text-text-secondary truncate">{member.profile?.email}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {!isOwner && (
                        <>
                          {isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<ShieldOff className="h-3.5 w-3.5" />}
                              onClick={() => handleDemote(member.user_id)}
                              title="Remove admin"
                            />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Shield className="h-3.5 w-3.5" />}
                              onClick={() => handlePromote(member.user_id)}
                              title="Promote to admin"
                            />
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<UserMinus className="h-3.5 w-3.5" />}
                            onClick={() => setRemoveMemberId(member.id)}
                            title="Remove member"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeMemberId}
        title="Remove Member"
        message="Are you sure you want to remove this member from the club?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveMemberId(null)}
      />
    </div>
  );
}
