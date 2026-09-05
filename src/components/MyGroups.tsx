import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type StudyGroup, type Membership } from '@/lib/supabase';
import { Loader2, BookOpen, Users, MapPin, Clock, LogOut } from 'lucide-react';

type Props = {
  onOpenGroup: (id: string) => void;
};

export default function MyGroups({ onOpenGroup }: Props) {
  const { user } = useAuth();
  const [createdGroups, setCreatedGroups] = useState<StudyGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<StudyGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: created }, { data: myMemberships }] = await Promise.all([
      supabase.from('study_groups').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('memberships').select('group_id').eq('user_id', user.id),
    ]);

    const createdList = (created as StudyGroup[] | null) ?? [];
    setCreatedGroups(createdList);

    const membershipList = (myMemberships as Membership[] | null) ?? [];
    const joinedIds = membershipList.map((m) => m.group_id);

    let joinedList: StudyGroup[] = [];
    if (joinedIds.length > 0) {
      const { data: joinedData } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', joinedIds)
        .neq('creator_id', user.id)
        .order('created_at', { ascending: false });
      joinedList = (joinedData as StudyGroup[] | null) ?? [];
    }
    setJoinedGroups(joinedList);

    const allIds = [...createdList.map((g) => g.id), ...joinedList.map((g) => g.id)];
    if (allIds.length > 0) {
      const { data: allMembers } = await supabase.from('memberships').select('group_id').in('group_id', allIds);
      const counts: Record<string, number> = {};
      (allMembers as Membership[] | null)?.forEach((m) => {
        counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;
      });
      setMemberCounts(counts);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeave = async (groupId: string) => {
    const { error: leaveErr } = await supabase.from('memberships').delete().eq('group_id', groupId).eq('user_id', user?.id);
    if (leaveErr) {
      alert('Could not leave the group. Please try again.');
      return;
    }
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const hasAny = createdGroups.length > 0 || joinedGroups.length > 0;

  if (!hasAny) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">My Groups</h1>
        <p className="text-slate-500 mb-8">Groups you organize and groups you've joined.</p>
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No groups yet</h3>
          <p className="text-slate-400 mt-1">Browse groups and join one, or create your own.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">My Groups</h1>
      <p className="text-slate-500 mb-8">Groups you organize and groups you've joined.</p>

      {createdGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Organizing</h2>
          <div className="space-y-3">
            {createdGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                memberCount={memberCounts[g.id] ?? 0}
                onOpen={() => onOpenGroup(g.id)}
              />
            ))}
          </div>
        </div>
      )}

      {joinedGroups.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Joined</h2>
          <div className="space-y-3">
            {joinedGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                memberCount={memberCounts[g.id] ?? 0}
                onOpen={() => onOpenGroup(g.id)}
                onLeave={() => handleLeave(g.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupRow({
  group,
  memberCount,
  onOpen,
  onLeave,
}: {
  group: StudyGroup;
  memberCount: number;
  onOpen: () => void;
  onLeave?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <button onClick={onOpen} className="flex-1 flex items-center gap-4 text-left min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold shrink-0">
          {group.course_code.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{group.title}</p>
          <p className="text-sm text-slate-500 truncate">{group.course_code} — {group.course_name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {memberCount}/{group.max_members}
            </span>
            {group.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {group.location}
              </span>
            )}
            {group.meeting_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {group.meeting_time}
              </span>
            )}
          </div>
        </div>
      </button>
      {onLeave && (
        <button
          onClick={onLeave}
          className="p-2.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
