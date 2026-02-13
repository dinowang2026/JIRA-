
import React from 'react';
import { 
  X, 
  CheckCircle2, 
  CalendarDays, 
  Clock, 
  ExternalLink, 
  BellRing,
  AlertTriangle,
  Check,
  Circle
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { isTaskOverdue, isTaskUpcoming } from '../utils';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdateTask }) => {
  if (!task) return null;

  const isDone = task.status === TaskStatus.Done;
  const overdue = !isDone && isTaskOverdue(task.reviewDate);
  const upcoming = !isDone && isTaskUpcoming(task.reviewDate);

  const handleToggleDone = () => {
    if (!onUpdateTask) return;
    const newStatus = isDone ? TaskStatus.Processing : TaskStatus.Done;
    onUpdateTask({ ...task, status: newStatus, lastUpdated: new Date() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3 flex-1 pr-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-widest">{task.project}</span>
                <PriorityBadge priority={task.priority} />
              </div>
              <h3 className={`text-3xl font-black text-slate-900 leading-tight transition-all ${isDone ? 'line-through text-slate-400' : ''}`}>
                {task.summary}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Quick Toggle Done Button */}
          <button 
            onClick={handleToggleDone}
            className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${
              isDone 
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
                : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 bg-white'
            }`}
          >
            {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            <span>{isDone ? '任務已完成' : '標記為完成'}</span>
          </button>

          {!isDone && overdue && (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-700">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500">
                <BellRing className="animate-pulse" />
              </div>
              <div>
                <p className="font-black text-lg">任務已逾期！</p>
                <p className="text-sm opacity-80">請儘速處理或勾選完成。</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
            <DetailRow label="目前狀態" value={task.status} icon={<CheckCircle2 size={16} />} />
            <DetailRow 
              label="Review 日期" 
              value={task.reviewDate?.toLocaleDateString() || '未設定'} 
              icon={<CalendarDays size={16} />} 
              highlight={overdue}
              subText={isDone ? '已結案' : overdue ? '已過期' : upcoming ? '即將到期' : ''}
            />
            <DetailRow label="最後更新" value={task.lastUpdated.toLocaleString()} icon={<Clock size={16} />} />
            <DetailRow label="問題類型" value={task.type} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <ExternalLink size={14} />
              最新進度更新內容
            </label>
            <div className="p-5 bg-white border border-slate-200 rounded-[1.5rem] text-slate-700 whitespace-pre-wrap text-sm leading-relaxed max-h-48 overflow-y-auto shadow-inner border-l-8 border-l-indigo-500">
              {task.statusUpdate || '尚無更新內容。'}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 flex justify-end px-8">
          <button 
            onClick={onClose}
            className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            返回檢視
          </button>
        </div>
      </div>
    </div>
  );
};

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const styles = {
    [TaskPriority.P1]: 'bg-rose-100 text-rose-700',
    [TaskPriority.P2]: 'bg-amber-100 text-amber-700',
    [TaskPriority.P3]: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const DetailRow: React.FC<{ label: string; value: string; icon?: React.ReactNode; highlight?: boolean; subText?: string }> = ({ label, value, icon, highlight, subText }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 opacity-80">
      {icon} {label}
    </div>
    <div className="flex items-baseline gap-2">
      <div className={`text-sm font-black ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>
        {value}
      </div>
      {subText && <span className={`text-[10px] font-bold ${highlight ? 'text-rose-500' : 'text-emerald-500'}`}>{subText}</span>}
    </div>
  </div>
);
