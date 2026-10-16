import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  AppTask, 
  Habit, 
  Goal, 
  Category, 
  UserProfile, 
  ReminderSettings, 
  PlantState,
  AppBackupData,
  FocusSessionLog,
  GoalStatus
} from './types';
import { 
  INITIAL_CATEGORIES, 
  getInitialGoals, 
  getInitialTasks, 
  getInitialHabits 
} from './data/initialData';
import { 
  getTodayJalali, 
  jalaliToFormattedString, 
  toPersianDigits, 
  WEEKDAYS, 
  isDateHoliday,
  addDaysJalali,
  getCurrentPersianDateTimeString
} from './calendar/jalali';
import { 
  loadFromLocalStorage, 
  saveToLocalStorage, 
  STORAGE_KEYS, 
  DEFAULT_USER_PROFILE, 
  DEFAULT_REMINDER_SETTINGS,
  saveLocalSnapshot,
  triggerServerSync,
  fetchServerData,
  startPeriodicPersistence,
  checkAndPerformVersionUpgradeMigration,
  mergeEntitiesById
} from './services/storageService';
import { 
  setupThemeListeners, 
  getDarkModePreference, 
  getDarkModeSchedule,
  applyDarkMode,
  computeEffectiveDarkMode
} from './services/themeService';
import { 
  playAlarmSound, 
  stopAllAlarmSounds 
} from './services/soundService';
import { 
  sendBrowserNotification, 
  getTaskEffectiveReminderTime,
  isNotificationSupported,
  getNotificationPermission
} from './services/reminderService';
import { APP_VERSION_INFO } from './version';

// Screens
import { TodayScreen } from './components/TodayScreen';
import { TasksScreen } from './components/TasksScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { PersianCalendarScreen } from './components/PersianCalendarScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';

// Modals
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { GoalModal } from './components/GoalModal';
import { AnnualGoalWizardModal } from './components/AnnualGoalWizardModal';
import { GoalDetailHistoryModal } from './components/GoalDetailHistoryModal';
import { TimerModal } from './components/TimerModal';
import { ReminderAlertModal } from './components/ReminderAlertModal';
import { TransferTaskModal } from './components/TransferTaskModal';

// Icons
import { 
  CheckSquare, 
  RotateCw, 
  Target, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Settings as SettingsIcon,
  Sprout,
  Plus,
  Bell,
  Sun,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';
import { PlantIcon } from './components/PlantIcon';

export type MainTab = 'TODAY' | 'TASKS' | 'HABITS' | 'GOALS' | 'CALENDAR' | 'REPORTS' | 'SETTINGS';

export const App: React.FC = () => {
  const today = useMemo(() => getTodayJalali(), []);
  const todayStr = useMemo(() => jalaliToFormattedString(today), [today]);

  // --- Core State Hydration ---
  const [categories, setCategories] = useState<Category[]>(() => {
    return loadFromLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    return loadFromLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, getInitialGoals());
  });

  const [tasks, setTasks] = useState<AppTask[]>(() => {
    return loadFromLocalStorage<AppTask[]>(STORAGE_KEYS.TASKS, getInitialTasks());
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    return loadFromLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, getInitialHabits());
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return loadFromLocalStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE);
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    return loadFromLocalStorage<ReminderSettings>(STORAGE_KEYS.REMINDER_SETTINGS, DEFAULT_REMINDER_SETTINGS);
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<MainTab>('TODAY');

  // PWA Install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AppTask | null>(null);
  const [isDuplicateTaskMode, setIsDuplicateTaskMode] = useState(false);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDuplicateHabitMode, setIsDuplicateHabitMode] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isAnnualWizardOpen, setIsAnnualWizardOpen] = useState(false);
  const [selectedHistoryGoal, setSelectedHistoryGoal] = useState<Goal | null>(null);

  const [taskToTransfer, setTaskToTransfer] = useState<AppTask | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<{
    isOpen: boolean;
    title: string;
    minutes: number;
    entityType?: 'TASK' | 'HABIT';
    taskId?: string;
    habitId?: string;
    initialElapsedSeconds?: number;
    currentProgressPercent?: number;
    onDone?: (elapsedSeconds: number, isFullyCompleted: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    minutes: 25,
  });

  // Reminder alert popup
  const [activeAlertTask, setActiveAlertTask] = useState<AppTask | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  // --- Initial Data Hydration: Restore personal user data from server/database if local state is empty or incomplete ---
  useEffect(() => {
    fetchServerData().then(serverData => {
      if (serverData) {
        if (Array.isArray(serverData.categories) && serverData.categories.length > 0) {
          setCategories(prev => mergeEntitiesById(INITIAL_CATEGORIES, prev, serverData.categories));
        }
        if (Array.isArray(serverData.goals) && serverData.goals.length > 0) {
          setGoals(prev => prev.length > 0 ? prev : serverData.goals);
        }
        if (Array.isArray(serverData.tasks) && serverData.tasks.length > 0) {
          setTasks(prev => prev.length > 0 ? prev : serverData.tasks);
        }
        if (Array.isArray(serverData.habits) && serverData.habits.length > 0) {
          setHabits(prev => prev.length > 0 ? prev : serverData.habits);
        }
        if (serverData.userProfile && serverData.userProfile.name) {
          setUserProfile(prev => (prev?.name && prev.name !== DEFAULT_USER_PROFILE.name) ? prev : serverData.userProfile!);
        }
        if (serverData.reminderSettings) {
          setReminderSettings(prev => prev || serverData.reminderSettings!);
        }
      }
    }).catch(err => {
      console.warn('[Data Hydration]:', err);
    });
  }, []);

  // --- Theme & Version Migration on Mount ---
  useEffect(() => {
    try {
      checkAndPerformVersionUpgradeMigration(
        { categories, goals, tasks, habits, userProfile, reminderSettings },
        APP_VERSION_INFO.currentVersion,
        APP_VERSION_INFO.versionCode
      );
    } catch (e) {
      console.warn('Migration error caught:', e);
    }

    const pref = getDarkModePreference(userProfile);
    const schedule = getDarkModeSchedule(userProfile);
    const effective = computeEffectiveDarkMode(pref, schedule);
    applyDarkMode(effective);

    const cleanupTheme = setupThemeListeners(pref, schedule);
    return () => {
      cleanupTheme();
    };
  }, [userProfile?.darkModePreference, userProfile?.darkModeSchedule, userProfile?.darkMode]);

  // PWA beforeinstallprompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // --- Auto-Save Persistence & Snapshots ---
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.GOALS, goals);
  }, [goals]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.HABITS, habits);
  }, [habits]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.REMINDER_SETTINGS, reminderSettings);
  }, [reminderSettings]);

  // Periodic File-Based Persistence & Lifecycle Flusher: writes to data/ outside public/dist
  useEffect(() => {
    const cleanupPersistence = startPeriodicPersistence(() => ({
      categories,
      goals,
      tasks,
      habits,
      userProfile,
      reminderSettings,
    }), 12000);

    // Debounced quick sync on every user action
    const timer = setTimeout(() => {
      saveLocalSnapshot({
        categories,
        goals,
        tasks,
        habits,
        userProfile,
        reminderSettings,
      });
      triggerServerSync({
        categories,
        goals,
        tasks,
        habits,
        userProfile,
        reminderSettings,
      }, 500);
    }, 1000);

    return () => {
      cleanupPersistence();
      clearTimeout(timer);
    };
  }, [categories, goals, tasks, habits, userProfile, reminderSettings]);

  // --- Plant Growth State for Today ---
  const plantState = useMemo<PlantState>(() => {
    // 1. Today's active tasks
    const todayTasks = tasks.filter(t => !t.isArchived && (t.dueDate === todayStr || (!t.dueDate && !t.isCompleted)));
    const completedTasksCount = todayTasks.filter(t => t.isCompleted).length;

    // 2. Today's habits
    const todayDayOfWeek = (today.day + 1) % 7; // approximate weekday index
    const activeHabits = habits.filter(h => !h.isClosed);
    const completedHabitsCount = activeHabits.filter(h => !!h.completionHistory?.[todayStr]).length;

    const totalCount = todayTasks.length + activeHabits.length;
    const completedCount = completedTasksCount + completedHabitsCount;

    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let stage: PlantState['stage'] = 'SEED';
    if (progressPercent >= 100 && totalCount > 0) stage = 'FULL_BLOOM';
    else if (progressPercent >= 80) stage = 'FLOWERING';
    else if (progressPercent >= 60) stage = 'BUDDING';
    else if (progressPercent >= 35) stage = 'SAPLING';
    else if (progressPercent > 0) stage = 'SPROUT';

    return {
      stage,
      progressPercent,
      completedCount,
      totalCount,
    };
  }, [tasks, habits, todayStr, today]);

  // --- Real-time Scheduled Reminder Check ---
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkScheduledReminders = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check tasks scheduled for today or without date that match current time
      tasks.forEach((task) => {
        if (task.isCompleted || task.isArchived) return;
        if (task.dueDate && task.dueDate !== todayStr) return;

        const effectiveReminderTime = getTaskEffectiveReminderTime(task);
        if (!effectiveReminderTime) return;

        const taskKey = `${task.id}_${todayStr}_${effectiveReminderTime}`;
        if (notifiedTasksRef.current.has(taskKey)) return;

        if (effectiveReminderTime === currentTimeStr) {
          notifiedTasksRef.current.add(taskKey);

          // Play sound
          if (reminderSettings.soundEnabled) {
            try {
              playAlarmSound(task.customAlarmSound || reminderSettings.selectedSoundId, reminderSettings.volume);
            } catch (err) {
              console.warn('Alarm sound play error:', err);
            }
          }

          // Trigger native notification
          sendBrowserNotification(`یادآور جوانه: ${task.title}`, {
            body: task.notes || 'زمان رسیدگی به این برنامه فرا رسیده است.',
            tag: task.id,
            onClick: () => {
              setActiveTab('TASKS');
            }
          });

          // Show in-app alert modal
          setActiveAlertTask(task);
        }
      });
    };

    const intervalId = window.setInterval(checkScheduledReminders, 15000);
    // Initial check
    checkScheduledReminders();

    return () => window.clearInterval(intervalId);
  }, [tasks, reminderSettings, todayStr]);

  // --- Handlers: Tasks ---
  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextState,
          completedAt: nextState ? todayStr : null,
        };
      }
      return t;
    }));
  }, [todayStr]);

  const handleSaveTask = useCallback((taskData: AppTask) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === taskData.id);
      if (exists) {
        return prev.map(t => t.id === taskData.id ? taskData : t);
      }
      return [taskData, ...prev];
    });
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleEditTask = useCallback((task: AppTask) => {
    setEditingTask(task);
    setIsDuplicateTaskMode(false);
    setIsTaskModalOpen(true);
  }, []);

  const handleDuplicateTask = useCallback((task: AppTask) => {
    setEditingTask({
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${task.title} (کپی)`,
      isCompleted: false,
      completedAt: null,
      focusProgressPercent: 0,
      timerSecondsElapsed: 0,
    });
    setIsDuplicateTaskMode(true);
    setIsTaskModalOpen(true);
  }, []);

  const handleNewTask = useCallback((initialDate?: string) => {
    setEditingTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      notes: '',
      categoryId: categories[0]?.id || 'cat-work',
      dueDate: initialDate || todayStr,
      time: '10:00',
      repeatType: 'NONE',
      repeatDaysOfWeek: [],
      timerSecondsTarget: 25 * 60,
      timerSecondsElapsed: 0,
      isCompleted: false,
    });
    setIsDuplicateTaskMode(false);
    setIsTaskModalOpen(true);
  }, [categories, todayStr]);

  const handleArchiveTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: true } : t));
  }, []);

  const handleRestoreTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: false } : t));
  }, []);

  const handleClearArchivedTasks = useCallback((taskIds?: string[]) => {
    if (taskIds && taskIds.length > 0) {
      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
    } else {
      setTasks(prev => prev.filter(t => !t.isArchived));
    }
  }, []);

  const handleTransferTask = useCallback((
    taskId: string, 
    targetGoalId: string | null, 
    closeTask: boolean, 
    noteAppend?: string
  ) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          goalId: targetGoalId,
          isCompleted: closeTask ? true : t.isCompleted,
          completedAt: closeTask ? todayStr : t.completedAt,
          notes: noteAppend ? `${t.notes || ''}\n${noteAppend}`.trim() : t.notes,
        };
      }
      return t;
    }));
    setTaskToTransfer(null);
  }, [todayStr]);

  // --- Handlers: Habits ---
  const handleToggleHabitDate = useCallback((habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const currentDone = Boolean(h.completionHistory?.[dateStr]);
        return {
          ...h,
          completionHistory: {
            ...(h.completionHistory || {}),
            [dateStr]: !currentDone,
          },
        };
      }
      return h;
    }));
  }, []);

  const handleSaveHabit = useCallback((habitData: Habit) => {
    setHabits(prev => {
      const exists = prev.some(h => h.id === habitData.id);
      if (exists) {
        return prev.map(h => h.id === habitData.id ? habitData : h);
      }
      return [habitData, ...prev];
    });
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }, []);

  const handleDeleteHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  }, []);

  const handleEditHabit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsDuplicateHabitMode(false);
    setIsHabitModalOpen(true);
  }, []);

  const handleDuplicateHabit = useCallback((habit: Habit) => {
    setEditingHabit({
      ...habit,
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${habit.title} (کپی)`,
      completionHistory: {},
      dailyProgressHistory: {},
      dailyElapsedSeconds: {},
      createdAt: todayStr,
    });
    setIsDuplicateHabitMode(true);
    setIsHabitModalOpen(true);
  }, [todayStr]);

  const handleNewHabit = useCallback(() => {
    setEditingHabit({
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      notes: '',
      categoryId: categories[0]?.id || 'cat-work',
      time: '08:00',
      timerMinutes: 15,
      frequency: 'DAILY',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      exemptHolidays: false,
      exemptWeekends: false,
      plantType: 'بونسای',
      completionHistory: {},
      createdAt: todayStr,
    });
    setIsDuplicateHabitMode(false);
    setIsHabitModalOpen(true);
  }, [categories, todayStr]);

  const handleToggleCloseHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const nextClosed = !h.isClosed;
        return {
          ...h,
          isClosed: nextClosed,
          closedAt: nextClosed ? todayStr : null,
        };
      }
      return h;
    }));
  }, [todayStr]);

  // --- Handlers: Goals ---
  const handleSaveGoal = useCallback((goalData: Goal) => {
    setGoals(prev => {
      const exists = prev.some(g => g.id === goalData.id);
      if (exists) {
        return prev.map(g => g.id === goalData.id ? goalData : g);
      }
      return [goalData, ...prev];
    });
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  const handleEditGoal = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  }, []);

  const handleNewGoal = useCallback((
    parentId?: string | null,
    period?: 'ANNUAL' | 'SEASONAL' | 'MONTHLY',
    seasonIndex?: number
  ) => {
    const parent = parentId ? goals.find(g => g.id === parentId) : null;
    const catId = parent?.categoryId || categories[0]?.id || 'cat-work';

    setEditingGoal({
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      description: '',
      year: parent?.year || today.year,
      period: period || (parentId ? 'SEASONAL' : 'ANNUAL'),
      status: 'IN_PROGRESS',
      startDate: todayStr,
      parentId: parentId || null,
      seasonIndex: seasonIndex !== undefined ? seasonIndex : (period === 'SEASONAL' ? Math.floor((today.month - 1) / 3) : undefined),
      categoryId: catId,
      plantType: parent?.plantType || 'بونسای',
      history: [
        {
          id: `h_${Date.now()}`,
          timestamp: getCurrentPersianDateTimeString(),
          action: 'CREATED',
          description: 'ایجاد اولیه هدف'
        }
      ],
      createdAt: todayStr,
    });
    setIsGoalModalOpen(true);
  }, [goals, categories, today, todayStr]);

  const handleUpdateGoalProgress = useCallback((
    goalId: string, 
    manualProgress: number | null, 
    isManualActive: boolean
  ) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          manualProgress,
          isManualProgressActive: isManualActive,
          status: manualProgress === 100 ? 'COMPLETED' : g.status,
          history: [
            ...g.history,
            {
              id: `h_${Date.now()}`,
              timestamp: getCurrentPersianDateTimeString(),
              action: 'EDITED',
              description: `تنظیم دستی پیشرفت به ${toPersianDigits(manualProgress ?? 0)}٪`
            }
          ]
        };
      }
      return g;
    }));
  }, []);

  const handleGoalWizardSave = useCallback((
    annualGoal: Goal, 
    intermediateGoals: Goal[], 
    microTask?: AppTask, 
    microHabit?: Habit
  ) => {
    setGoals(prev => [annualGoal, ...intermediateGoals, ...prev]);
    if (microTask) setTasks(prev => [microTask, ...prev]);
    if (microHabit) setHabits(prev => [microHabit, ...prev]);
    setIsAnnualWizardOpen(false);
  }, []);

  // --- Handlers: Timer & Focus Sessions ---
  const handleOpenTimer = useCallback((
    title: string,
    minutes: number,
    onDone?: (elapsedSeconds: number, isFullyCompleted: boolean) => void,
    options?: {
      entityType?: 'TASK' | 'HABIT';
      taskId?: string;
      habitId?: string;
      initialElapsedSeconds?: number;
      currentProgressPercent?: number;
    }
  ) => {
    setTimerState({
      isOpen: true,
      title,
      minutes,
      entityType: options?.entityType || 'TASK',
      taskId: options?.taskId,
      habitId: options?.habitId,
      initialElapsedSeconds: options?.initialElapsedSeconds || 0,
      currentProgressPercent: options?.currentProgressPercent || 0,
      onDone,
    });
  }, []);

  const handleTimerComplete = useCallback((elapsedSeconds: number, isFullyCompleted: boolean) => {
    const { taskId, habitId, entityType, onDone, minutes } = timerState;

    if (onDone) {
      onDone(elapsedSeconds, isFullyCompleted);
    }

    const log: FocusSessionLog = {
      id: `focus_${Date.now()}`,
      dateStr: todayStr,
      timestamp: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      targetSeconds: (minutes || 25) * 60,
      completed100: isFullyCompleted,
      progressPercent: Math.min(100, Math.round((elapsedSeconds / ((minutes || 25) * 60)) * 100)),
    };

    if (entityType === 'TASK' && taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const sessions = [...(t.focusSessions || []), log];
          return {
            ...t,
            timerSecondsElapsed: (t.timerSecondsElapsed || 0) + elapsedSeconds,
            focusProgressPercent: isFullyCompleted ? 100 : Math.min(100, Math.round(((t.timerSecondsElapsed || 0) + elapsedSeconds) / (t.timerSecondsTarget || 1500) * 100)),
            isCompleted: isFullyCompleted ? true : t.isCompleted,
            completedAt: isFullyCompleted ? todayStr : t.completedAt,
            focusSessions: sessions,
          };
        }
        return t;
      }));
    } else if (entityType === 'HABIT' && habitId) {
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          const sessions = [...(h.focusSessions || []), log];
          const prevDayElapsed = h.dailyElapsedSeconds?.[todayStr] || 0;
          return {
            ...h,
            dailyElapsedSeconds: {
              ...(h.dailyElapsedSeconds || {}),
              [todayStr]: prevDayElapsed + elapsedSeconds,
            },
            dailyProgressHistory: {
              ...(h.dailyProgressHistory || {}),
              [todayStr]: isFullyCompleted ? 100 : Math.min(100, Math.round(((prevDayElapsed + elapsedSeconds) / ((h.timerMinutes || 15) * 60)) * 100)),
            },
            completionHistory: {
              ...(h.completionHistory || {}),
              [todayStr]: isFullyCompleted ? true : Boolean(h.completionHistory?.[todayStr]),
            },
            focusSessions: sessions,
          };
        }
        return h;
      }));
    }

    setTimerState(prev => ({ ...prev, isOpen: false }));
  }, [timerState, todayStr]);

  // --- Handlers: Settings & Backup ---
  const handleSaveUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

  const handleSaveReminderSettings = useCallback((settings: ReminderSettings) => {
    setReminderSettings(settings);
  }, []);

  const handleSaveCategory = useCallback((cat: Category) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === cat.id);
      if (exists) return prev.map(c => c.id === cat.id ? cat : c);
      return [...prev, cat];
    });
  }, []);

  const handleDeleteCategory = useCallback((catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  }, []);

  const handleResetCategories = useCallback(() => {
    setCategories(INITIAL_CATEGORIES);
  }, []);

  const handleImportTasksOnly = useCallback((importedTasks: AppTask[]) => {
    setTasks(prev => mergeEntitiesById(prev, importedTasks));
  }, []);

  const handleImportAllData = useCallback((data: AppBackupData) => {
    if (data.categories && data.categories.length > 0) setCategories(data.categories);
    if (data.goals) setGoals(data.goals);
    if (data.tasks) setTasks(data.tasks);
    if (data.habits) setHabits(data.habits);
    if (data.userProfile) setUserProfile(data.userProfile);
    if (data.reminderSettings) setReminderSettings(data.reminderSettings);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // Nav Items
  const navItems = [
    { id: 'TODAY' as MainTab, label: 'امروز', icon: Sun },
    { id: 'TASKS' as MainTab, label: 'وظایف', icon: CheckSquare, badge: tasks.filter(t => !t.isCompleted && !t.isArchived).length },
    { id: 'HABITS' as MainTab, label: 'عادت‌ها', icon: RotateCw, badge: habits.filter(h => !h.isClosed && !h.completionHistory?.[todayStr]).length },
    { id: 'GOALS' as MainTab, label: 'اهداف', icon: Target },
    { id: 'CALENDAR' as MainTab, label: 'تقویم', icon: CalendarIcon },
    { id: 'REPORTS' as MainTab, label: 'گزارشات', icon: BarChart3 },
    { id: 'SETTINGS' as MainTab, label: 'تنظیمات', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F5] text-[#1A2E1A] flex flex-col font-sans select-none antialiased selection:bg-emerald-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('TODAY')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900">
                  جوانه
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  v{APP_VERSION_INFO.currentVersion}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-none">
                {WEEKDAYS[today.day % 7]}، {toPersianDigits(today.day)} {today.month} {toPersianDigits(today.year)}
              </p>
            </div>
          </div>

          {/* Plant Progress Indicator & Fast Actions */}
          <div className="flex items-center gap-2">
            {/* Today Plant Status Pill */}
            <div 
              onClick={() => setActiveTab('TODAY')}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/80 cursor-pointer transition-colors shadow-2xs"
              title="مشاهده باغچه امروز"
            >
              <PlantIcon plantType={userProfile?.avatarUrl || 'بونسای'} stage={plantState.stage} className="w-5 h-5" />
              <div className="text-right">
                <div className="text-[10px] font-bold text-emerald-950 flex items-center gap-1">
                  <span>رشد امروز:</span>
                  <span className="font-mono text-emerald-700">%{toPersianDigits(plantState.progressPercent)}</span>
                </div>
              </div>
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={() => handleNewTask()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="افزودن تسک سریع"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 pb-24">
        {activeTab === 'TODAY' && (
          <TodayScreen
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
            plantState={plantState}
            userProfile={userProfile}
            onOpenSettings={() => setActiveTab('SETTINGS')}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={(id) => handleToggleHabitDate(id, todayStr)}
            onToggleHabitDate={handleToggleHabitDate}
            onOpenTimer={handleOpenTimer}
            onOpenNewTask={() => handleNewTask()}
            onOpenNewHabit={() => handleNewHabit()}
            onDuplicateTask={handleDuplicateTask}
            onEditTask={handleEditTask}
          />
        )}

        {activeTab === 'TASKS' && (
          <TasksScreen
            tasks={tasks}
            categories={categories}
            goals={goals}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onNewTask={() => handleNewTask()}
            onOpenTimer={handleOpenTimer}
            onTransferTask={handleTransferTask}
            onArchiveTask={handleArchiveTask}
            onRestoreTask={handleRestoreTask}
            onClearArchivedTasks={handleClearArchivedTasks}
            onDuplicateTask={handleDuplicateTask}
            onOpenTasksBackup={() => setActiveTab('SETTINGS')}
          />
        )}

        {activeTab === 'HABITS' && (
          <HabitsScreen
            habits={habits}
            categories={categories}
            goals={goals}
            onToggleHabitDate={handleToggleHabitDate}
            onDeleteHabit={handleDeleteHabit}
            onEditHabit={handleEditHabit}
            onDuplicateHabit={handleDuplicateHabit}
            onNewHabit={handleNewHabit}
            onOpenTimer={handleOpenTimer}
            onToggleCloseHabit={handleToggleCloseHabit}
          />
        )}

        {activeTab === 'GOALS' && (
          <GoalsScreen
            goals={goals}
            tasks={tasks}
            habits={habits}
            categories={categories}
            onOpenAnnualWizard={() => setIsAnnualWizardOpen(true)}
            onNewGoal={handleNewGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onViewHistory={(g) => setSelectedHistoryGoal(g)}
            onNewTaskForGoal={(gId) => {
              setEditingTask({
                id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                title: '',
                notes: '',
                categoryId: categories[0]?.id || 'cat-work',
                goalId: gId,
                dueDate: todayStr,
                repeatType: 'NONE',
                repeatDaysOfWeek: [],
                timerSecondsTarget: 25 * 60,
                timerSecondsElapsed: 0,
                isCompleted: false,
              });
              setIsTaskModalOpen(true);
            }}
            onNewHabitForGoal={(gId) => {
              setEditingHabit({
                id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                title: '',
                notes: '',
                categoryId: categories[0]?.id || 'cat-work',
                goalId: gId,
                frequency: 'DAILY',
                targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                exemptHolidays: false,
                exemptWeekends: false,
                plantType: 'بونسای',
                timerMinutes: 15,
                completionHistory: {},
                createdAt: todayStr,
              });
              setIsHabitModalOpen(true);
            }}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={(id) => handleToggleHabitDate(id, todayStr)}
            onOpenTimer={handleOpenTimer}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'CALENDAR' && (
          <PersianCalendarScreen
            tasks={tasks}
            habits={habits}
            categories={categories}
            goals={goals}
            onToggleTask={handleToggleTask}
            onToggleHabitDate={handleToggleHabitDate}
            onOpenTimer={handleOpenTimer}
            onNewTaskWithDate={(dateStr) => handleNewTask(dateStr)}
          />
        )}

        {activeTab === 'REPORTS' && (
          <ReportsScreen
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsScreen
            categories={categories}
            goals={goals}
            tasks={tasks}
            habits={habits}
            userProfile={userProfile}
            reminderSettings={reminderSettings}
            deferredPrompt={deferredPrompt}
            onInstallClick={handleInstallClick}
            onSaveUserProfile={handleSaveUserProfile}
            onSaveReminderSettings={handleSaveReminderSettings}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetCategories={handleResetCategories}
            onImportTasksOnly={handleImportTasksOnly}
            onImportAllData={handleImportAllData}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-lg px-2 py-1.5">
        <div className="max-w-md mx-auto grid grid-cols-7 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50/90 font-black scale-105'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-xs">
                      {toPersianDigits(item.badge! > 99 ? '99+' : item.badge!)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        categories={categories}
        goals={goals}
        reminderSettings={reminderSettings}
        isDuplicate={isDuplicateTaskMode}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        habit={editingHabit}
        categories={categories}
        goals={goals}
        isDuplicate={isDuplicateHabitMode}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        goal={editingGoal}
        categories={categories}
        existingGoals={goals}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <AnnualGoalWizardModal
        isOpen={isAnnualWizardOpen}
        categories={categories}
        onClose={() => setIsAnnualWizardOpen(false)}
        onSaveComplete={handleGoalWizardSave}
      />

      <GoalDetailHistoryModal
        isOpen={Boolean(selectedHistoryGoal)}
        goal={selectedHistoryGoal}
        subGoals={goals.filter(g => g.parentId === selectedHistoryGoal?.id)}
        linkedTasks={tasks.filter(t => t.goalId === selectedHistoryGoal?.id)}
        onClose={() => setSelectedHistoryGoal(null)}
        onEdit={(g) => {
          setSelectedHistoryGoal(null);
          handleEditGoal(g);
        }}
        onUpdateStatus={(gId, status, note) => {
          setGoals(prev => prev.map(g => {
            if (g.id === gId) {
              return {
                ...g,
                status,
                history: [
                  ...g.history,
                  {
                    id: `h_${Date.now()}`,
                    timestamp: getCurrentPersianDateTimeString(),
                    action: 'STATUS_CHANGED',
                    description: `تغییر وضعیت به ${status}${note ? `: ${note}` : ''}`,
                  }
                ]
              };
            }
            return g;
          }));
        }}
        onAddNote={(gId, note) => {
          setGoals(prev => prev.map(g => {
            if (g.id === gId) {
              return {
                ...g,
                history: [
                  ...g.history,
                  {
                    id: `h_${Date.now()}`,
                    timestamp: getCurrentPersianDateTimeString(),
                    action: 'NOTE_ADDED',
                    description: note,
                  }
                ]
              };
            }
            return g;
          }));
        }}
      />

      <TimerModal
        isOpen={timerState.isOpen}
        title={timerState.title}
        initialMinutes={timerState.minutes}
        initialElapsedSeconds={timerState.initialElapsedSeconds}
        currentProgressPercent={timerState.currentProgressPercent}
        entityType={timerState.entityType}
        onClose={() => setTimerState(prev => ({ ...prev, isOpen: false }))}
        onComplete={handleTimerComplete}
      />

      <ReminderAlertModal
        isOpen={Boolean(activeAlertTask)}
        task={activeAlertTask}
        category={categories.find(c => c.id === activeAlertTask?.categoryId)}
        soundTitle={reminderSettings.selectedSoundId}
        reminderSettings={reminderSettings}
        holidayNotice={isDateHoliday(today)?.title}
        onDismiss={() => {
          stopAllAlarmSounds();
          setActiveAlertTask(null);
        }}
        onComplete={(tId) => {
          stopAllAlarmSounds();
          handleToggleTask(tId);
          setActiveAlertTask(null);
        }}
        onSnooze={(tId, mins) => {
          stopAllAlarmSounds();
          const [h, m] = (activeAlertTask?.time || '12:00').split(':').map(Number);
          const totalMin = h * 60 + m + mins;
          const nextH = Math.floor(totalMin / 60) % 24;
          const nextM = totalMin % 60;
          const nextSnoozeAt = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;

          setTasks(prev => prev.map(t => t.id === tId ? {
            ...t,
            nextSnoozeAt,
            snoozeCount: (t.snoozeCount || 0) + 1,
          } : t));

          setActiveAlertTask(null);
        }}
      />

      {taskToTransfer && (
        <TransferTaskModal
          isOpen={Boolean(taskToTransfer)}
          task={taskToTransfer}
          goals={goals}
          onClose={() => setTaskToTransfer(null)}
          onConfirm={(targetGoalId, closeTask, noteAppend) => {
            handleTransferTask(taskToTransfer.id, targetGoalId, closeTask, noteAppend);
          }}
        />
      )}
    </div>
  );
};
