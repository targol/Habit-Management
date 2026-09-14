import React, { useState, useEffect } from 'react';
import { AppTask, Habit, Goal, Category, PlantState, GoalStatus, GoalHistoryEntry } from './types';
import { 
  INITIAL_CATEGORIES, 
  getInitialGoals, 
  getInitialTasks, 
  getInitialHabits 
} from './data/initialData';
import { getTodayJalali, jalaliToFormattedString, getCurrentPersianDateTimeString } from './calendar/jalali';
import { TodayScreen } from './components/TodayScreen';
import { TasksScreen } from './components/TasksScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { GoalModal } from './components/GoalModal';
import { AnnualGoalWizardModal } from './components/AnnualGoalWizardModal';
import { GoalDetailHistoryModal } from './components/GoalDetailHistoryModal';
import { TimerModal } from './components/TimerModal';
import { 
  Sprout, 
  CheckSquare, 
  Flame, 
  Target, 
  BarChart3, 
  Plus, 
  Clock,
  Sparkles
} from 'lucide-react';

type NavTab = 'TODAY' | 'TASKS' | 'HABITS' | 'GOALS' | 'REPORTS';

export const App: React.FC = () => {
  // --- Persistent State ---
  const [categories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('javaneh_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('javaneh_goals');
    return saved ? JSON.parse(saved) : getInitialGoals();
  });

  const [tasks, setTasks] = useState<AppTask[]>(() => {
    const saved = localStorage.getItem('javaneh_tasks');
    return saved ? JSON.parse(saved) : getInitialTasks();
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('javaneh_habits');
    return saved ? JSON.parse(saved) : getInitialHabits();
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('javaneh_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('javaneh_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('javaneh_habits', JSON.stringify(habits));
  }, [habits]);

  // --- Active Tab ---
  const [currentTab, setCurrentTab] = useState<NavTab>('TODAY');

  // --- Modals State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AppTask | null>(null);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Annual Goal Wizard Modal State
  const [isAnnualWizardOpen, setIsAnnualWizardOpen] = useState(false);

  // Goal History & Detail Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null);

  const [timerConfig, setTimerConfig] = useState<{
    isOpen: boolean;
    title: string;
    minutes: number;
    onDone?: () => void;
  }>({
    isOpen: false,
    title: '',
    minutes: 25,
  });

  // --- Plant Growth State Calculation ---
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);

  const todayTasks = tasks.filter(t => {
    if (t.dueDate === todayStr) return true;
    if (t.repeatType === 'DAILY') return true;
    if (t.repeatType === 'WEEKLY' && t.repeatDaysOfWeek.includes(today.day % 7)) return true;
    return false;
  });

  const totalCount = Math.max(1, todayTasks.length + habits.length);
  const completedTasksCount = todayTasks.filter(t => t.isCompleted).length;
  const completedHabitsCount = habits.filter(h => !!h.completionHistory[todayStr]).length;
  const completedCount = completedTasksCount + completedHabitsCount;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  let stage: PlantState['stage'] = 'SEED';
  if (progressPercent >= 100) stage = 'FULL_BLOOM';
  else if (progressPercent >= 75) stage = 'FLOWERING';
  else if (progressPercent >= 50) stage = 'BUDDING';
  else if (progressPercent >= 25) stage = 'SAPLING';
  else if (progressPercent > 0) stage = 'SPROUT';

  const plantState: PlantState = {
    stage,
    progressPercent,
    completedCount,
    totalCount,
  };

  // --- Task Operations ---
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextDone = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextDone,
          completedAt: nextDone ? todayStr : null,
        };
      }
      return t;
    }));
  };

  const handleSaveTask = (newTask: AppTask) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === newTask.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newTask;
        return next;
      }
      return [newTask, ...prev];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Habit Operations ---
  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const nextHistory = { ...h.completionHistory };
        if (nextHistory[dateStr]) {
          delete nextHistory[dateStr];
        } else {
          nextHistory[dateStr] = true;
        }
        return { ...h, completionHistory: nextHistory };
      }
      return h;
    }));
  };

  const handleSaveHabit = (newHabit: Habit) => {
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === newHabit.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newHabit;
        return next;
      }
      return [newHabit, ...prev];
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // --- Goal Operations ---
  const handleSaveGoal = (newGoal: Goal) => {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === newGoal.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newGoal;
        return next;
      }
      return [newGoal, ...prev];
    });

    // If this goal was open in history modal, update it as well
    if (selectedGoalForHistory && selectedGoalForHistory.id === newGoal.id) {
      setSelectedGoalForHistory(newGoal);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId && g.parentId !== goalId));
    if (selectedGoalForHistory?.id === goalId) {
      setIsHistoryModalOpen(false);
      setSelectedGoalForHistory(null);
    }
  };

  const handleUpdateGoalStatus = (goalId: string, status: GoalStatus, note?: string) => {
    const timestampNow = getCurrentPersianDateTimeString();
    const statusLabels: Record<GoalStatus, string> = {
      NOT_STARTED: 'شروع نشده',
      IN_PROGRESS: 'در حال انجام',
      COMPLETED: 'تکمیل شده',
      PAUSED: 'متوقف شده',
    };

    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'STATUS_CHANGED',
          description: `تغییر وضعیت به: ${statusLabels[status]}${note ? ` (توضیح: ${note})` : ''}`,
          previousValues: { status: g.status }
        };
        const updated = {
          ...g,
          status,
          history: [entry, ...(g.history || [])],
        };
        if (selectedGoalForHistory?.id === goalId) {
          setSelectedGoalForHistory(updated);
        }
        return updated;
      }
      return g;
    }));
  };

  const handleAddGoalNote = (goalId: string, note: string) => {
    const timestampNow = getCurrentPersianDateTimeString();
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'NOTE_ADDED',
          description: note,
        };
        const updated = {
          ...g,
          history: [entry, ...(g.history || [])],
        };
        if (selectedGoalForHistory?.id === goalId) {
          setSelectedGoalForHistory(updated);
        }
        return updated;
      }
      return g;
    }));
  };

  const handleAddGoalMilestone = (goalId: string, title: string) => {
    const timestampNow = getCurrentPersianDateTimeString();
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'MILESTONE_COMPLETED',
          description: `دستیابی به نقطه عطف: ${title}`,
        };
        const updated = {
          ...g,
          history: [entry, ...(g.history || [])],
        };
        if (selectedGoalForHistory?.id === goalId) {
          setSelectedGoalForHistory(updated);
        }
        return updated;
      }
      return g;
    }));
  };

  // Annual Goal Wizard save handler
  const handleSaveAnnualWizard = (annualGoal: Goal, intermediateGoal?: Goal, microTask?: AppTask) => {
    setGoals(prev => {
      const added = [annualGoal];
      if (intermediateGoal) added.push(intermediateGoal);
      return [...added, ...prev];
    });

    if (microTask) {
      setTasks(prev => [microTask, ...prev]);
    }

    // Switch to GOALS tab to see the newly created hierarchy
    setCurrentTab('GOALS');
  };

  // Helper to open task modal pre-filled for a specific goal
  const handleNewTaskForGoal = (goalId: string) => {
    setEditingTask({
      id: `task-${Date.now()}`,
      title: '',
      notes: '',
      categoryId: categories[0]?.id || 'cat-work',
      goalId,
      dueDate: todayStr,
      repeatType: 'NONE',
      repeatDaysOfWeek: [today.day % 7],
      weekOfMonth: 1,
      dayOfWeek: 0,
      timerSecondsTarget: 1500,
      timerSecondsElapsed: 0,
      isCompleted: false,
    });
    setIsTaskModalOpen(true);
  };

  // Helper to open new goal modal pre-filled with parent or period
  const handleOpenNewGoalModal = (parentId?: string | null, period?: 'ANNUAL' | 'SEASONAL' | 'MONTHLY') => {
    setEditingGoal({
      id: '', // Empty ID ensures it is treated as a clean new goal
      title: '',
      description: '',
      visionWhy: '',
      year: today.year,
      period: period || (parentId ? 'SEASONAL' : 'ANNUAL'),
      status: 'IN_PROGRESS',
      startDate: todayStr,
      parentId: parentId || null,
      categoryId: categories[0]?.id || 'cat-work',
      plantType: 'بونسای',
      history: [],
      createdAt: todayStr,
    });
    setIsGoalModalOpen(true);
  };

  // --- Timer Helper ---
  const openTimer = (title: string, minutes: number, onDone?: () => void) => {
    setTimerConfig({
      isOpen: true,
      title,
      minutes,
      onDone,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] text-[#1A2E1A] flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-emerald-950 tracking-tight flex items-center gap-1.5">
                <span>جوانه</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                  PWA
                </span>
              </h1>
              <p className="text-[10px] text-gray-400">تسک‌ها، عادات و اهداف سالانه</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAnnualWizardOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">طراحی هدف سالانه</span>
            </button>

            <button
              type="button"
              onClick={() => openTimer('جلسه تمرکز آزاد', 25)}
              className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">تایمر تمرکز</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسک سریع</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5">
        {currentTab === 'TODAY' && (
          <TodayScreen
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
            plantState={plantState}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={(id) => handleToggleHabitDate(id, todayStr)}
            onOpenTimer={(title, mins, cb) => openTimer(title, mins, cb)}
            onOpenNewTask={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            onOpenNewHabit={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
          />
        )}

        {currentTab === 'TASKS' && (
          <TasksScreen
            tasks={tasks}
            categories={categories}
            goals={goals}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
            onNewTask={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            onOpenTimer={(title, mins, cb) => openTimer(title, mins, cb)}
          />
        )}

        {currentTab === 'HABITS' && (
          <HabitsScreen
            habits={habits}
            categories={categories}
            goals={goals}
            onToggleHabitDate={handleToggleHabitDate}
            onDeleteHabit={handleDeleteHabit}
            onEditHabit={(h) => { setEditingHabit(h); setIsHabitModalOpen(true); }}
            onNewHabit={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
            onOpenTimer={(title, mins, cb) => openTimer(title, mins, cb)}
          />
        )}

        {currentTab === 'GOALS' && (
          <GoalsScreen
            goals={goals}
            tasks={tasks}
            habits={habits}
            categories={categories}
            onOpenAnnualWizard={() => setIsAnnualWizardOpen(true)}
            onNewGoal={handleOpenNewGoalModal}
            onEditGoal={(g) => { setEditingGoal(g); setIsGoalModalOpen(true); }}
            onDeleteGoal={handleDeleteGoal}
            onViewHistory={(g) => { setSelectedGoalForHistory(g); setIsHistoryModalOpen(true); }}
            onNewTaskForGoal={handleNewTaskForGoal}
            onToggleTask={handleToggleTask}
            onOpenTimer={(title, mins, cb) => openTimer(title, mins, cb)}
          />
        )}

        {currentTab === 'REPORTS' && (
          <ReportsScreen
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100/90 shadow-md">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCurrentTab('TODAY')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'TODAY' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sprout className={`w-5 h-5 ${currentTab === 'TODAY' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">امروز و باغچه</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('TASKS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'TASKS' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <CheckSquare className={`w-5 h-5 ${currentTab === 'TASKS' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">تسک‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('HABITS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'HABITS' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Flame className={`w-5 h-5 ${currentTab === 'HABITS' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">عادت‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('GOALS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'GOALS' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Target className={`w-5 h-5 ${currentTab === 'GOALS' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">اهداف</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('REPORTS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'REPORTS' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${currentTab === 'REPORTS' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">گزارش‌ها</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AnnualGoalWizardModal
        isOpen={isAnnualWizardOpen}
        categories={categories}
        onClose={() => setIsAnnualWizardOpen(false)}
        onSaveComplete={handleSaveAnnualWizard}
      />

      <GoalDetailHistoryModal
        isOpen={isHistoryModalOpen}
        goal={selectedGoalForHistory}
        subGoals={goals.filter(g => g.parentId === selectedGoalForHistory?.id)}
        linkedTasks={tasks.filter(t => t.goalId === selectedGoalForHistory?.id)}
        onClose={() => { setIsHistoryModalOpen(false); setSelectedGoalForHistory(null); }}
        onEdit={(g) => {
          setIsHistoryModalOpen(false);
          setEditingGoal(g);
          setIsGoalModalOpen(true);
        }}
        onUpdateStatus={handleUpdateGoalStatus}
        onAddNote={handleAddGoalNote}
        onAddMilestone={handleAddGoalMilestone}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        categories={categories}
        goals={goals}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        habit={editingHabit}
        categories={categories}
        goals={goals}
        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
      />

      <GoalModal
        key={isGoalModalOpen ? (editingGoal?.id || `new-goal-modal-${Date.now()}`) : 'goal-modal-closed'}
        isOpen={isGoalModalOpen}
        goal={editingGoal}
        categories={categories}
        existingGoals={goals}
        onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }}
        onSave={handleSaveGoal}
      />

      <TimerModal
        isOpen={timerConfig.isOpen}
        title={timerConfig.title}
        initialMinutes={timerConfig.minutes}
        onClose={() => setTimerConfig(prev => ({ ...prev, isOpen: false }))}
        onComplete={(elapsed) => {
          if (timerConfig.onDone) {
            timerConfig.onDone();
          }
        }}
      />
    </div>
  );
};
