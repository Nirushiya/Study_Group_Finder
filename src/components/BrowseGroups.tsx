import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type StudyGroup, type Membership } from '@/lib/supabase';
import { Search, MapPin, Clock, Users, Plus, Loader2, BookOpen } from 'lucide-react';
import GroupCard from './GroupCard';

type Props = {
  onOpenGroup: (id: string) => void;
  onCreateGroup: () => void;
};

export default function BrowseGroups({ onOpenGroup, onCreateGroup }: Props) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: groupData }, { data: memberData }, { data: myMemberData }] = await Promise.all([
      supabase.from('study_groups').select('*').order('created_at', { ascending: false }),
      supabase.from('memberships').select('group_id'),
      supabase.from('memberships').select('group_id').eq('user_id', user?.id ?? ''),
    ]);

    if (groupData) setGroups(groupData as StudyGroup[]);

    const counts: Record<string, number> = {};
    (memberData as Membership[] | null)?.forEach((m) => {
      counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;
    });
    setMemberCounts(counts);

    const mySet = new Set<string>();
    (myMemberData as Membership[] | null)?.forEach((m) => mySet.add(m.group_id));
    setMyMemberships(mySet);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      g.title.toLowerCase().includes(q) ||
      g.course_code.toLowerCase().includes(q) ||
      g.course_name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Discover Study Groups</h1>
          <p className="text-slate-500 mt-1">Find a group for your course and start studying together.</p>
        </div>
        <button
          onClick={onCreateGroup}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course code, name, or keyword..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No groups found</h3>
          <p className="text-slate-400 mt-1">Try a different search or create a new group.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              memberCount={memberCounts[group.id] ?? 0}
              isMember={myMemberships.has(group.id)}
              isCreator={group.creator_id === user?.id}
              onOpen={() => onOpenGroup(group.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { MapPin, Clock, Users };
