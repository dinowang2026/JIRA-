
import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  subDays
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Circle,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { isTaskOverdue, isTaskUpcoming } from '../utils';
import { TaskDetailModal } from './TaskDetailModal';

interface CalendarViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
}

type ViewType = 'month' | 'week' | 'day';
type CardSize = 'sm' | 'md' | 'lg';

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onUpdateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [cardSize, setCardSize] = useState<CardSize>(() => 
    (localStorage.getItem('preferred_card_size') as CardSize) || 'md'
  );

  useEffect(() => {
    localStorage.setItem('preferred_card_size', cardSize);
  }, [cardSize]);

  const tasksWithReview = useMemo(() => 
    tasks.filter(t => t.reviewDate).map(t => ({
      ...t,
      reviewDate: t.reviewDate!
    })), [tasks]
  );

  const switchToDay = (date: Date) => {
    setCurrentDate(date);
    setViewType('day');
  };

  const handleToggleDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === TaskStatus.Done ? TaskStatus.Processing : TaskStatus.Done;
    onUpdateTask({ ...task, status: newStatus, lastUpdated: new Date() });
  };

  const renderHeader = () => {
    const dateFormat = viewType === 'day' ? "yyyy年 MMMM d日" : "yyyy年 MMMM";
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {format(currentDate, dateFormat, { locale: zhTW })}
            </h2>
            {viewType === 'day' && (
               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{format(currentDate, 'EEEE', { locale: zhTW })}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Size Controls for Day View */}
          {viewType === 'day' && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setCardSize('sm')} className={`p-1.5 rounded-lg transition-all ${cardSize === 'sm' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><Minimize2 size={14} /></button>
              <button onClick={() => setCardSize('md')} className={`p-1.5 rounded-lg transition-all ${cardSize === 'md' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><Type size={14} /></button>
              <button onClick={() => setCardSize('lg')} className={`p-1.5 rounded-lg transition-all ${cardSize === 'lg' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><Maximize2 size={14} /></button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            {(['month', 'week', 'day'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                  viewType === type 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {type === 'month' ? '月' : type === 'week' ? '週' : '日'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={prevPeriod} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600">今天</button>
            <button onClick={nextPeriod} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    );
  };

  const prevPeriod = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const nextPeriod = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayTasks = tasksWithReview.filter(t => isSameDay(t.reviewDate, cloneDay));
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        days.push(
          <div
            key={day.toString()}
            onClick={() => switchToDay(cloneDay)}
            className={`min-h-[130px] bg-white border-r border-b border-slate-100 p-2 transition-all hover:bg-slate-50/80 cursor-pointer group ${!isCurrentMonth ? 'bg-slate-50/30' : ''} ${isToday ? 'bg-indigo-50/40' : ''}`}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-md shadow-indigo-100' : isCurrentMonth ? 'text-slate-800' : 'text-slate-300'}`}>{format(day, "d")}</span>
              {dayTasks.filter(t => t.status !== TaskStatus.Done).length > 0 && (<div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />)}
            </div>
            <div className="space-y-1">
              {dayTasks.slice(0, 3).map(task => {
                const isDone = task.status === TaskStatus.Done;
                return (
                  <div key={task.id} onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }} className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate border-l-2 cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-sm ${isDone ? 'opacity-40 line-through bg-slate-100 border-l-slate-400' : getPriorityStyle(task.priority)}`}>
                    {task.summary}
                  </div>
                );
              })}
              {dayTasks.length > 3 && (<div className="text-[9px] text-indigo-500 font-black pl-1 mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-transform">還有 {dayTasks.length - 3} 個 <ArrowRight size={8} /></div>)}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
          {['日', '一', '二', '三', '四', '五', '六'].map(label => (<div key={label} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>))}
        </div>
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });
    return (
      <div className="grid grid-cols-7 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 h-[600px]">
        {days.map(day => {
          const cloneDay = day;
          const dayTasks = tasksWithReview.filter(t => isSameDay(t.reviewDate, day));
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toString()} className={`flex flex-col border-r border-slate-100 last:border-0 p-4 transition-colors hover:bg-slate-50/50 ${isToday ? 'bg-indigo-50/20' : ''}`}>
              <button onClick={() => switchToDay(cloneDay)} className="text-center mb-8 group">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">{format(day, 'EEEE', { locale: zhTW })}</div>
                <div className={`text-3xl font-black transition-transform group-hover:scale-110 ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>{format(day, 'd')}</div>
              </button>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 pb-4">
                {dayTasks.map(task => {
                  const isDone = task.status === TaskStatus.Done;
                  return (
                    <div key={task.id} onClick={() => setSelectedTask(task)} className={`p-3.5 rounded-2xl border-l-4 shadow-sm group cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all bg-white ${isDone ? 'opacity-40 grayscale border-l-slate-300' : getPriorityStyle(task.priority)}`}>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">{task.project}</div>
                      <div className={`text-xs font-bold text-slate-800 leading-snug line-clamp-3 mb-2 ${isDone ? 'line-through' : ''}`}>{task.summary}</div>
                      <div className="flex items-center justify-between text-[9px] font-black opacity-60"><span className="flex items-center gap-1"><Clock size={10} /> {format(task.reviewDate, 'HH:mm')}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = tasksWithReview.filter(t => isSameDay(t.reviewDate, currentDate)).sort((a, b) => {
         const aDone = a.status === TaskStatus.Done ? 1 : 0;
         const bDone = b.status === TaskStatus.Done ? 1 : 0;
         if (aDone !== bDone) return aDone - bDone;
         return a.reviewDate.getTime() - b.reviewDate.getTime();
    });

    // 尺寸映射 (與 TaskList 保持一致)
    const sizeStyles = {
      sm: { container: 'p-3 gap-3 rounded-xl', title: 'text-sm', check: 'w-6 h-6', checkIcon: 14, icon: 16 },
      md: { container: 'p-6 gap-6 rounded-[2rem]', title: 'text-xl', check: 'w-8 h-8', checkIcon: 18, icon: 20 },
      lg: { container: 'p-8 gap-8 rounded-[3rem]', title: 'text-2xl', check: 'w-10 h-10', checkIcon: 22, icon: 24 }
    }[cardSize];

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {dayTasks.length > 0 ? (
          dayTasks.map(task => {
            const isDone = task.status === TaskStatus.Done;
            return (
              <div key={task.id} onClick={() => setSelectedTask(task)} className={`bg-white border border-slate-200 transition-all group cursor-pointer active:scale-[0.99] flex items-start shadow-sm ${sizeStyles.container} ${isDone ? 'opacity-60 grayscale border-slate-100' : 'hover:border-indigo-200 hover:shadow-xl'}`}>
                <button onClick={(e) => handleToggleDone(e, task)} className={`shrink-0 mt-1 rounded-full border-2 flex items-center justify-center transition-all ${sizeStyles.check} ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-indigo-400 hover:text-indigo-200'}`}>
                  {isDone ? <Check size={sizeStyles.checkIcon} strokeWidth={3} /> : <Circle size={sizeStyles.checkIcon} />}
                </button>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest">{task.project}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-slate-400' : task.priority === TaskPriority.P1 ? 'text-rose-600' : 'text-amber-600'}`}>{task.priority}</span>
                    </div>
                  </div>
                  <h4 className={`font-black text-slate-800 transition-colors leading-tight ${sizeStyles.title} ${isDone ? 'line-through text-slate-400' : 'group-hover:text-indigo-600'}`}>{task.summary}</h4>
                  <div className="flex items-center gap-6 text-xs text-slate-400 font-bold">
                    <div className="flex items-center gap-1.5"><Clock size={14} className="text-slate-300" /><span>{format(task.reviewDate, 'HH:mm')}</span></div>
                  </div>
                </div>
                <div className={`self-center p-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all`}>
                  <ArrowRight size={sizeStyles.icon} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6"><CalendarIcon size={40} /></div>
            <h4 className="text-xl font-black text-slate-800">今日無 Review 任務</h4>
            <button onClick={() => setViewType('month')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black">返回月曆</button>
          </div>
        )}
      </div>
    );
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch(priority) {
      case TaskPriority.P1: return 'border-l-rose-500 bg-rose-50/50 text-rose-700';
      case TaskPriority.P2: return 'border-l-amber-500 bg-amber-50/50 text-amber-700';
      default: return 'border-l-indigo-500 bg-indigo-50/50 text-indigo-700';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 px-1">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdateTask={onUpdateTask} />
    </div>
  );
};
