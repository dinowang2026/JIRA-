
import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  BellRing,
  ShieldAlert
} from 'lucide-react';
import { Task } from '../types';
import { isTaskOverdue, isTaskUpcoming, isTaskStale } from '../utils';

interface DashboardProps {
  tasks: Task[];
  stats: {
    total: number;
    overdue: number;
    upcoming: number;
    stale: number;
    completed: number;
  };
  onViewTasks: () => void;
  onStatClick: (type: 'total' | 'overdue' | 'upcoming' | 'stale') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, stats, onViewTasks, onStatClick }) => {
  const criticalTasks = tasks
    .filter(t => isTaskOverdue(t.reviewDate) || isTaskUpcoming(t.reviewDate))
    .sort((a, b) => {
      const dateA = a.reviewDate?.getTime() || Infinity;
      const dateB = b.reviewDate?.getTime() || Infinity;
      return dateA - dateB;
    })
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">專案狀態儀表板</h1>
          <p className="text-slate-500 mt-1">即時監控專案進度與 Review 到期提醒。</p>
        </div>
        <div className="text-right">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前狀態</div>
           <div className="flex items-center gap-2 mt-1">
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.overdue > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
               {stats.overdue > 0 ? '需緊急處理' : '運行正常'}
             </span>
           </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="任務總數" 
          value={stats.total} 
          icon={<TrendingUp className="text-indigo-600" />} 
          color="indigo"
          onClick={() => onStatClick('total')}
        />
        <StatCard 
          label="已逾期 (Review)" 
          value={stats.overdue} 
          icon={<ShieldAlert className="text-rose-600" />} 
          color="rose" 
          sub="需立即更新進度"
          onClick={() => onStatClick('overdue')}
        />
        <StatCard 
          label="即將到期" 
          value={stats.upcoming} 
          icon={<BellRing className="text-amber-600" />} 
          color="amber" 
          sub="未來 3 天內"
          onClick={() => onStatClick('upcoming')}
        />
        <StatCard 
          label="久未更新" 
          value={stats.stale} 
          icon={<Clock className="text-slate-600" />} 
          color="slate" 
          sub="超過 3 天未更動"
          onClick={() => onStatClick('stale')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              到期提醒專區
            </h3>
            <button 
              onClick={onViewTasks}
              className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all text-sm flex items-center gap-1"
            >
              查看完整清單 <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {criticalTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {criticalTasks.map(task => (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={onViewTasks}>
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 mt-2 rounded-full ${isTaskOverdue(task.reviewDate) ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                      <div>
                        <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{task.summary}</div>
                        {task.statusUpdate && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <span className="font-black text-indigo-400 not-italic mr-1">進度：</span>
                            {task.statusUpdate}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 flex gap-2 mt-1 items-center">
                          <span className="font-mono bg-slate-100 px-1.5 rounded text-[10px]">{task.project}</span>
                          <span>•</span>
                          <span className={isTaskOverdue(task.reviewDate) ? 'text-rose-600 font-bold' : ''}>
                            Review：{task.reviewDate?.toLocaleDateString() || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1 ${
                         task.priority === 'P1' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {task.priority}
                       </span>
                       {isTaskOverdue(task.reviewDate) && <span className="text-[10px] font-bold text-rose-500">已過期</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-slate-900 font-bold">目前無緊急任務</h4>
                <p className="text-sm">所有 Review 日期皆在掌握中，做得好！</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold">快速檢索</h3>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <FilterItem label="P1 極高優先級" count={tasks.filter(t => t.priority === 'P1').length} color="bg-rose-500" onClick={() => onStatClick('total')} />
            <FilterItem label="已過期任務" count={stats.overdue} color="bg-rose-600" bold onClick={() => onStatClick('overdue')} />
            <FilterItem label="近期需 Review" count={stats.upcoming} color="bg-amber-500" onClick={() => onStatClick('upcoming')} />
            <FilterItem label="處理中專案" count={tasks.filter(t => t.status === '处理中').length} color="bg-indigo-500" onClick={() => onStatClick('total')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; sub?: string; onClick: () => void }> = ({ 
  label, value, icon, color, sub, onClick 
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300',
    rose: 'bg-rose-50 border-rose-100 hover:border-rose-300',
    amber: 'bg-amber-50 border-amber-100 hover:border-amber-300',
    slate: 'bg-slate-50 border-slate-100 hover:border-slate-300',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-2xl border text-left w-full transition-all hover:scale-[1.02] hover:shadow-md ${colorMap[color] || colorMap.slate} group`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900 leading-none group-hover:text-indigo-700 transition-colors">{value}</div>
      {sub && <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{sub}</div>}
    </button>
  );
};

const FilterItem: React.FC<{ label: string; count: number; color: string; bold?: boolean; onClick: () => void }> = ({ label, count, color, bold, onClick }) => (
  <div onClick={onClick} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className={`text-sm font-medium ${bold ? 'text-slate-900 font-bold' : 'text-slate-600'} group-hover:text-indigo-600 transition-colors`}>{label}</span>
    </div>
    <span className="text-xs font-bold bg-slate-50 px-2 py-0.5 rounded text-slate-500 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600">{count}</span>
  </div>
);
