import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { X, Loader2 } from 'lucide-react';

type Props = {
  onClose: () => void;
  onCreated: (id: string) => void;
};

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('study_groups')
      .insert({
        title: title.trim(),
        course_code: courseCode.trim(),
        course_name: courseName.trim(),
        description: description.trim(),
        location: location.trim(),
        meeting_time: meetingTime.trim(),
        max_members: Math.max(2, Math.min(100, maxMembers)),
        creator_id: user?.id,
      })
      .select('id')
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? 'Failed to create group');
      setLoading(false);
      return;
    }

    setLoading(false);
    onCreated(data.id);
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-slate-900">Create a Study Group</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Group Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Exam Prep Squad"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code *</label>
              <input
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
                className={inputClass}
              />
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name *</label>
            <input
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Intro to Computer Science"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study? What should people bring?"
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Library Room 204"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Time</label>
              <input
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="e.g. Tuesdays 6 PM"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
