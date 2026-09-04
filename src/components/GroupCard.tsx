import type { StudyGroup } from '@/lib/supabase';
import { MapPin, Clock, Users, BookOpen, CheckCircle2 } from 'lucide-react';

type Props = {
  group: StudyGroup;
  memberCount: number;
  isMember: boolean;
  isCreator: boolean;
  onOpen: () => void;
};

export default function GroupCard({ group, memberCount, isMember, isCreator, onOpen }: Props) {
  const full = memberCount >= group.max_members;

  return (
    <button
      onClick={onOpen}
      className="text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          {group.course_code}
        </div>
        {isMember && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Joined
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900 text-lg leading-snug mb-1 group-hover:text-blue-600 transition-colors">
        {group.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{group.course_name}</p>

      {group.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{group.description}</p>
      )}

      <div className="space-y-2 text-sm text-slate-500">
        {group.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{group.location}</span>
          </div>
        )}
        {group.meeting_time && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{group.meeting_time}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span className={full ? 'text-orange-600 font-medium' : ''}>
            {memberCount}/{group.max_members} members
            {full && ' — full'}
          </span>
        </div>
      </div>

      {isCreator && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400">You created this group</span>
        </div>
      )}
    </button>
  );
}
