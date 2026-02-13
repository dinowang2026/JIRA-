
import React from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  FileUp, 
  Search, 
  Bell, 
  Settings,
  Calendar,
  Menu,
  Send
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'tasks' | 'import' | 'calendar';
  setView: (view: 'dashboard' | 'tasks' | 'import' | 'calendar') => void;
  stats: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNotifications: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setView, 
  stats,
  searchQuery,
  setSearchQuery,
  onOpenNotifications
}) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">ProjectFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="儀表板" 
            active={currentView === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<ListTodo size={20} />} 
            label="任務清單" 
            active={currentView === 'tasks'} 
            onClick={() => setView('tasks')} 
            badge={stats.total}
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="日曆檢視" 
            active={currentView === 'calendar'} 
            onClick={() => setView('calendar')} 
          />
          <NavItem 
            icon={<FileUp size={20} />} 
            label="導入 CSV" 
            active={currentView === 'import'} 
            onClick={() => setView('import')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onOpenNotifications}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-colors font-bold"
          >
            <Send size={20} />
            <span>發送通知</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜尋專案或任務名稱..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div 
              onClick={onOpenNotifications}
              className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <Bell size={20} className="text-slate-600" />
              {(stats.upcoming > 0 || stats.overdue > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-200">
              User
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
        : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-semibold">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
        active ? 'bg-indigo-200' : 'bg-slate-200'
      }`}>
        {badge}
      </span>
    )}
  </button>
);
