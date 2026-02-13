'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useMembershipStore } from '@/stores/membershipStore';
import { Button, Card, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, User, Check, X } from 'lucide-react';

export default function ClubMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { members, fetchClubMembers, approveMember, rejectMember, loading } = useMembershipStore();
  const { showToast } = useToast();

  useEffect(() => {
    fetchClubMembers(clubId);
  }, [clubId, fetchClubMembers]);

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{member.profile?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-text-secondary">{member.profile?.email}</p>
                      {member.profile?.dupr_rating && (
                        <p className="text-xs text-text-tertiary">DUPR: {member.profile.dupr_rating}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
            {approvedMembers.map((member) => (
              <Card key={member.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{member.profile?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-text-secondary">{member.profile?.email}</p>
                  </div>
                  <Badge label="Member" color="#34C759" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
