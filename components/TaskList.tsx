
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  SortAsc, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Tag,
  ExternalLink,
  CalendarDays,
  ArrowUpDown,
  BellRing,
  Share2,
  Copy,
  Check,
  GripVertical,
  Circle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { isTaskOverdue, isTaskUpcoming, isTaskStale } from '../utils';
import { TaskDetailModal } from './TaskDetailModal';

interface TaskListProps {
  tasks: Task[];
  filterStale: boolean;
  setFilterStale: (stale: boolean) => void;
  filterUrgent: boolean;
  setFilterUrgent: (urgent: boolean) => void;
  onUpdateTask: (task: Task) => void;
  onReorderTasks: (tasks: Task[]) => void;
}

type SortOption = 'custom' | 'priority' | 'reviewSoonest';
type CardSize = 'sm' | 'md' | 'lg';

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  filterStale, 
  setFilterStale, 
  filterUrgent, 
  setFilterUrgent, 
  onUpdateTask,
  onReorderTasks
}) => {
  const [sortField, setSortField] = useState<SortOption>('custom');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState<CardSize>(() => 
    (localStorage.getItem('preferred_card_size') as CardSize) || 'md'
  );

  useEffect(() => {
    localStorage.setItem('preferred_card_size', cardSize);
  }, [cardSize]);

  // 排序邏輯
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDone = a.status === TaskStatus.Done ? 1 : 0;
      const bDone = b.status === TaskStatus.Done ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      if (sortField === 'custom') return (a.order || 0) - (b.order || 0);
      if (sortField === 'priority') return a.priority.localeCompare(b.priority);
      if (sortField === 'reviewSoonest') {
        const dateA = a.reviewDate?.getTime() || Infinity;
        const dateB = b.reviewDate?.getTime() || Infinity;
        return dateA - dateB;
      }
      return 0;
    });
  }, [tasks, sortField]);

  const handleDragStart = (id: string) => {
    setDraggedTaskId(id);
    setSortField('custom');
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const draggedIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = sortedTasks.findIndex(t => t.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newTasks = [...sortedTasks];
      const [removed] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, removed);
      onReorderTasks(newTasks);
    }
  };

  const handleToggleDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === TaskStatus.Done ? TaskStatus.Processing : TaskStatus.Done;
    onUpdateTask({ ...task, status: newStatus, lastUpdated: new Date() });
  };

  const generateReportText = () => {
    const today = new Date().toLocaleDateString();
    let report = `📋 任務進度彙報 (${today})\n\n`;
    const overdueTasks = tasks.filter(t => isTaskOverdue(t.reviewDate) && t.status !== TaskStatus.Done);
    if (overdueTasks.length > 0) {
      report += `⚠️ 已逾期任務:\n`;
      overdueTasks.forEach(t => report += `- [${t.priority}] ${t.summary}\n`);
    } else {
      report += `✅ 目前無逾期任務。`;
    }
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 bg-slate-50 py-2 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">工作待辦</h2>
          {filterUrgent && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">緊急優先</span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Size Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm mr-2">
            <button 
              onClick={() => setCardSize('sm')}
              className={`p-1.5 rounded-lg transition-all ${cardSize === 'sm' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="精簡"
            >
              <Minimize2 size={16} />
            </button>
            <button 
              onClick={() => setCardSize('md')}
              className={`p-1.5 rounded-lg transition-all ${cardSize === 'md' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="標準"
            >
              <Type size={16} />
            </button>
            <button 
              onClick={() => setCardSize('lg')}
              className={`p-1.5 rounded-lg transition-all ${cardSize === 'lg' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="寬敞"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <button 
            onClick={() => setShowReport(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Share2 size={14} />
            彙報
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 shadow-sm">
            <ArrowUpDown size={14} className="text-slate-400 ml-1" />
            <select 
              className="bg-transparent text-[11px] font-black px-2 py-1.5 outline-none text-slate-600 uppercase"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortOption)}
            >
              <option value="custom">自訂排序 (拖拽)</option>
              <option value="priority">按優先級</option>
              <option value="reviewSoonest">最早到期</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-20 custom-scrollbar">
        {sortedTasks.length > 0 ? (
          sortedTasks.map(task => (
            <div
              key={task.id}
              draggable={sortField === 'custom' && task.status !== TaskStatus.Done}
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              className={`group relative transition-all duration-300 ${draggedTaskId === task.id ? 'opacity-30 scale-95' : 'opacity-100'}`}
            >
              <TaskTodoCard 
                task={task} 
                onClick={() => setSelectedTask(task)}
                onToggleDone={(e) => handleToggleDone(e, task)}
                isDragging={draggedTaskId === task.id}
                canDrag={sortField === 'custom' && task.status !== TaskStatus.Done}
                size={cardSize}
              />
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            清單空空如也
          </div>
        )}
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800">生成彙報</h3>
               <button onClick={() => setShowReport(false)} className="text-slate-400">✕</button>
             </div>
             <div className="p-6">
               <textarea 
                  readOnly 
                  className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed outline-none"
                  value={generateReportText()}
                />
               <button 
                  onClick={copyToClipboard}
                  className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已複製到剪貼簿' : '複製彙報內容'}
                </button>
             </div>
           </div>
        </div>
      )}

      <TaskDetailModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
};

const TaskTodoCard: React.FC<{ 
  task: Task; 
  onClick: () => void; 
  onToggleDone: (e: React.MouseEvent) => void;
  isDragging: boolean;
  canDrag: boolean;
  size: CardSize;
}> = ({ task, onClick, onToggleDone, isDragging, canDrag, size }) => {
  const isDone = task.status === TaskStatus.Done;
  const overdue = !isDone && isTaskOverdue(task.reviewDate);
  const upcoming = !isDone && isTaskUpcoming(task.reviewDate);

  // 尺寸映射
  const sizeStyles = {
    sm: {
      container: 'p-2 gap-3 rounded-xl',
      title: 'text-xs',
      badge: 'text-[8px] px-1',
      meta: 'text-[9px] gap-2',
      check: 'w-6 h-6',
      checkIcon: 14,
      grip: 16
    },
    md: {
      container: 'p-4 gap-4 rounded-2xl',
      title: 'text-sm',
      badge: 'text-[9px] px-1.5',
      meta: 'text-[10px] gap-4',
      check: 'w-8 h-8',
      checkIcon: 18,
      grip: 20
    },
    lg: {
      container: 'p-6 gap-6 rounded-[2rem]',
      title: 'text-base',
      badge: 'text-[10px] px-2',
      meta: 'text-[11px] gap-6',
      check: 'w-10 h-10',
      checkIcon: 22,
      grip: 24
    }
  }[size];

  return (
    <div 
      onClick={onClick}
      className={`group flex items-center bg-white border border-slate-200 transition-all cursor-pointer hover:shadow-lg active:scale-[0.99] border-l-4 ${sizeStyles.container} ${
        isDone ? 'opacity-60 border-l-slate-300 grayscale' : 
        overdue ? 'border-l-rose-500 shadow-rose-50' : 
        upcoming ? 'border-l-amber-500 shadow-amber-50' : 'border-l-indigo-400'
      } ${isDragging ? 'shadow-2xl border-indigo-500 scale-105' : ''}`}
    >
      {canDrag && (
        <div className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
          <GripVertical size={sizeStyles.grip} />
        </div>
      )}

      <button 
        onClick={onToggleDone}
        className={`shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${sizeStyles.check} ${
          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-indigo-400 hover:text-indigo-200'
        }`}
      >
        {isDone ? <Check size={sizeStyles.checkIcon} strokeWidth={3} /> : <Circle size={sizeStyles.checkIcon} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-black rounded uppercase tracking-tighter ${sizeStyles.badge} ${
            task.priority === TaskPriority.P1 ? 'bg-rose-100 text-rose-600' : 
            task.priority === TaskPriority.P2 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {task.priority}
          </span>
          <span className={`font-bold text-slate-400 uppercase tracking-widest truncate ${sizeStyles.badge}`}>{task.project}</span>
          {overdue && <span className={`font-black text-rose-500 uppercase ${sizeStyles.badge}`}>!! 逾期</span>}
        </div>

        <h4 className={`font-bold text-slate-800 transition-all truncate ${sizeStyles.title} ${isDone ? 'line-through text-slate-400' : 'group-hover:text-indigo-600'}`}>
          {task.summary}
        </h4>

        {task.statusUpdate && (
          <div className={`mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 italic line-clamp-2 leading-relaxed ${size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-[11px]' : 'text-xs'}`}>
            <span className="font-black text-indigo-400 not-italic mr-1">最新進度：</span>
            {task.statusUpdate}
          </div>
        )}

        <div className={`flex items-center mt-1 text-slate-400 font-bold ${sizeStyles.meta}`}>
          <span className="flex items-center gap-1"><Clock size={sizeStyles.checkIcon-4} /> {task.lastUpdated.toLocaleDateString()}</span>
          {!isDone && task.reviewDate && (
             <span className={`flex items-center gap-1 ${overdue ? 'text-rose-500' : upcoming ? 'text-amber-600' : ''}`}>
               <CalendarDays size={sizeStyles.checkIcon-4} /> {task.reviewDate.toLocaleDateString()}
             </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1">
        <ChevronRight size={sizeStyles.grip} />
      </div>
    </div>
  );
};
