
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { CSVImporter } from './components/CSVImporter';
import { CalendarView } from './components/CalendarView';
import { NotificationCenter } from './components/NotificationCenter';
import { Task, TaskStatus } from './types';
import { isTaskOverdue, isTaskUpcoming, isTaskStale } from './utils';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'dashboard' | 'tasks' | 'import' | 'calendar'>('dashboard');
  const [filterStale, setFilterStale] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Persist tasks in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('project_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((t: any, index: number) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
          finishEta: new Date(t.finishEta),
          reviewDate: t.reviewDate ? new Date(t.reviewDate) : null,
          order: t.order ?? index // 確保舊資料也有順序
        }));
        setTasks(hydrated);
      } catch (e) {
        console.error("Failed to load saved tasks");
      }
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('project_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      overdue: tasks.filter(t => isTaskOverdue(t.reviewDate) && t.status !== TaskStatus.Done).length,
      upcoming: tasks.filter(t => isTaskUpcoming(t.reviewDate) && t.status !== TaskStatus.Done).length,
      stale: tasks.filter(t => isTaskStale(t.lastUpdated) && t.status !== TaskStatus.Done).length,
      completed: tasks.filter(t => t.status === TaskStatus.Done).length
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStale = filterStale ? isTaskStale(t.lastUpdated) : true;
      const matchesUrgent = filterUrgent ? (isTaskOverdue(t.reviewDate) || isTaskUpcoming(t.reviewDate)) : true;
      return matchesSearch && matchesStale && matchesUrgent;
    });
  }, [tasks, searchQuery, filterStale, filterUrgent]);

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleStatClick = (type: 'total' | 'overdue' | 'upcoming' | 'stale') => {
    setFilterStale(type === 'stale');
    setFilterUrgent(type === 'overdue' || type === 'upcoming');
    setView('tasks');
  };

  return (
    <Layout 
      currentView={view} 
      setView={(v) => {
        if (v !== 'tasks') {
          setFilterStale(false);
          setFilterUrgent(false);
        }
        setView(v);
      }} 
      stats={stats}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onOpenNotifications={() => setShowNotificationCenter(true)}
    >
      <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
        {view === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            stats={stats} 
            onViewTasks={() => setView('tasks')}
            onStatClick={handleStatClick}
          />
        )}
        
        {view === 'tasks' && (
          <TaskList 
            tasks={filteredTasks} 
            filterStale={filterStale}
            setFilterStale={setFilterStale}
            filterUrgent={filterUrgent}
            setFilterUrgent={setFilterUrgent}
            onUpdateTask={handleUpdateTask}
            onReorderTasks={(reordered) => {
              setTasks(prev => {
                const newTasks = [...prev];
                reordered.forEach((task, index) => {
                  const target = newTasks.find(t => t.id === task.id);
                  if (target) target.order = index;
                });
                return newTasks;
              });
            }}
          />
        )}

        {view === 'calendar' && (
          <CalendarView tasks={tasks} onUpdateTask={handleUpdateTask} />
        )}
        
        {view === 'import' && (
          <CSVImporter onImport={(newTasks) => {
            const withOrder = newTasks.map((t, i) => ({ ...t, order: i }));
            setTasks(withOrder);
            setView('dashboard');
          }} />
        )}

        {tasks.length === 0 && view !== 'import' && (
          <div className="mt-20 text-center space-y-4">
            <div className="text-6xl text-slate-300">📊</div>
            <h3 className="text-xl font-medium text-slate-600">目前沒有資料</h3>
            <button 
              onClick={() => setView('import')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              前往導入頁面
            </button>
          </div>
        )}
      </div>

      {showNotificationCenter && (
        <NotificationCenter 
          tasks={tasks} 
          onClose={() => setShowNotificationCenter(false)} 
        />
      )}
    </Layout>
  );
};

export default App;
