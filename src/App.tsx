import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthScreen from '@/components/AuthScreen';
import BrowseGroups from '@/components/BrowseGroups';
import MyGroups from '@/components/MyGroups';
import GroupDetail from '@/components/GroupDetail';
import CreateGroupModal from '@/components/CreateGroupModal';
import { GraduationCap, Compass, BookOpen, LogOut, Loader2 } from 'lucide-react';

type View = 'browse' | 'mygroups' | 'detail';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('browse');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const openGroup = (id: string) => {
    setSelectedGroupId(id);
    setView('detail');
  };

  const backToBrowse = () => {
    setSelectedGroupId(null);
    setView('browse');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={backToBrowse} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">StudyGroup</span>
          </button>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => { setView('browse'); setSelectedGroupId(null); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'browse' || view === 'detail'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </button>
            <button
              onClick={() => { setView('mygroups'); setSelectedGroupId(null); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'mygroups'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">My Groups</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        {view === 'browse' && (
          <BrowseGroups
            onOpenGroup={openGroup}
            onCreateGroup={() => setShowCreateModal(true)}
          />
        )}
        {view === 'mygroups' && <MyGroups onOpenGroup={openGroup} />}
        {view === 'detail' && selectedGroupId && (
          <GroupDetail groupId={selectedGroupId} onBack={backToBrowse} />
        )}
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            openGroup(id);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
