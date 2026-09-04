import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type StudyGroup, type Membership } from '@/lib/supabase';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Loader2,
  LogIn,
  LogOut,
  Trash2,
  Pencil,
  CheckCircle2,
  X,
} from 'lucide-react';

type Props = {
  groupId: string;
  onBack: () => void;
};

type MemberInfo = {
  user_id: string;
  email: string;
  joined_at: string;
};

export default function GroupDetail({ groupId, onBack }: Props) {
  const { user } = useAuth();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: groupData, error: groupErr } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (groupErr || !groupData) {
      setError('Could not load this group.');
      setLoading(false);
      return;
    }

    setGroup(groupData as StudyGroup);

    const { data: memberData } = await supabase
      .from('memberships')
      .select('user_id, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    const memberList = (memberData as Membership[] | null) ?? [];

    const emails = await Promise.all(
      memberList.map(async (m) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', m.user_id)
          .maybeSingle();
        return {
          user_id: m.user_id,
          email: profile?.email ?? 'Unknown student',
          joined_at: m.joined_at,
        };
      })
    );

    setMembers(emails);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const isMember = members.some((m) => m.user_id === user?.id);
  const isCreator = group?.creator_id === user?.id;
  const isFull = members.length >= (group?.max_members ?? 0);

  const handleJoin = async () => {
    setActionLoading(true);
    const { error: joinErr } = await supabase
      .from('memberships')
      .insert({ group_id: groupId, user_id: user?.id });
    if (joinErr) {
      setError(joinErr.message);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    fetchGroup();
  };

  const handleLeave = async () => {
    setActionLoading(true);
    const { error: leaveErr } = await supabase
      .from('memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user?.id);
    if (leaveErr) {
      setError(leaveErr.message);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    fetchGroup();
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const { error: delErr } = await supabase.from('study_groups').delete().eq('id', groupId);
    if (delErr) {
      setError(delErr.message);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    onBack();
  };

  const handleSaveEdit = async (updated: Partial<StudyGroup>) => {
    setActionLoading(true);
    const { error: updateErr } = await supabase.from('study_groups').update(updated).eq('id', groupId);
    if (updateErr) {
      setError(updateErr.message);
      setActionLoading(false);
      return;
    }
    setActionLoading(false);
    setEditing(false);
    fetchGroup();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-red-600">{error ?? 'Group not found.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={onBack}
        className="text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to groups
      </button>

      {editing ? (
        <EditForm group={group} onSave={handleSaveEdit} onCancel={() => setEditing(false)} loading={actionLoading} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold">
                <BookOpen className="w-4 h-4" />
                {group.course_code}
              </div>
              {isCreator && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">{group.title}</h1>
            <p className="text-slate-500 mb-4">{group.course_name}</p>

            {group.description && (
              <p className="text-slate-700 leading-relaxed mb-6">{group.description}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {group.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {group.location}
                </div>
              )}
              {group.meeting_time && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {group.meeting_time}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                {members.length} / {group.max_members} members
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              {!isCreator && !isMember && !isFull && (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  Join Group
                </button>
              )}
              {!isCreator && !isMember && isFull && (
                <p className="text-orange-600 font-medium text-sm">This group is full.</p>
              )}
              {!isCreator && isMember && (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Group
                </button>
              )}
              {isCreator && (
                <p className="text-sm text-slate-400">You are the organizer of this group.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Members ({members.length})</h2>
            {members.length === 0 ? (
              <p className="text-slate-400 text-sm">No members yet. Be the first to join!</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {m.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {m.email}
                        {m.user_id === group.creator_id && (
                          <span className="ml-2 text-xs text-blue-600 font-medium">Organizer</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        Joined {new Date(m.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    {m.user_id === user?.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EditForm({
  group,
  onSave,
  onCancel,
  loading,
}: {
  group: StudyGroup;
  onSave: (updated: Partial<StudyGroup>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(group.title);
  const [courseCode, setCourseCode] = useState(group.course_code);
  const [courseName, setCourseName] = useState(group.course_name);
  const [description, setDescription] = useState(group.description);
  const [location, setLocation] = useState(group.location);
  const [meetingTime, setMeetingTime] = useState(group.meeting_time);
  const [maxMembers, setMaxMembers] = useState(group.max_members);

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Edit Group</h2>
        <button onClick={onCancel} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, course_code: courseCode, course_name: courseName, description, location, meeting_time: meetingTime, max_members: maxMembers });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Group Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Members</label>
            <input
              type="number"
              min={2}
              max={100}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
          <input value={courseName} onChange={(e) => setCourseName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Time</label>
            <input value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
