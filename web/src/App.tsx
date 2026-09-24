import React, { useState, useEffect, useRef } from 'react';
import { AppTask, Habit, Goal, Category, PlantState, GoalStatus, GoalHistoryEntry, UserProfile, ReminderSettings } from './types';
import { 
  INITIAL_CATEGORIES, 
  getInitialGoals, 
  getInitialTasks, 
  getInitialHabits 
} from './data/initialData';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  saveToIndexedDB, 
  loadFromIndexedDB, 
  fetchServerData, 
  triggerServerSync,
  mergeEntitiesById,
  saveLocalSnapshot,
  resetLocalSnapshotsWithData,
  getLocalSnapshots,
  recoverAllLocalData,
  DEFAULT_USER_PROFILE,
  DEFAULT_REMINDER_SETTINGS,
  STORAGE_KEYS
} from './services/storageService';
import { 
  getTodayJalali, 
  jalaliToFormattedString, 
  getCurrentPersianDateTimeString, 
  toPersianDigits, 
  getDayOfWeek, 
  addDaysJalali,
  PERSIAN_MONTHS,
  WEEKDAYS,
  isDateHoliday
} from './calendar/jalali';
import { isTaskReminderDue, isTaskHolidayAdvanceReminderDue, triggerReminderAlarm, calculateSnoozeTime } from './services/reminderService';
import { stopAllAlarmSounds, PRESET_ALARM_SOUNDS } from './services/soundService';
import { TodayScreen } from './components/TodayScreen';
import { TasksScreen } from './components/TasksScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PersianCalendarScreen } from './components/PersianCalendarScreen';
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { GoalModal } from './components/GoalModal';
import { AnnualGoalWizardModal } from './components/AnnualGoalWizardModal';
import { GoalDetailHistoryModal } from './components/GoalDetailHistoryModal';
import { TimerModal } from './components/TimerModal';
import { ReminderAlertModal } from './components/ReminderAlertModal';
import { UpdateAndBackupModal } from './components/UpdateAndBackupModal';
import { ApkIntegrityModal } from './components/ApkIntegrityModal';
import { 
  Sprout, 
  CheckSquare, 
  Flame, 
  Target, 
  BarChart3, 
  Plus, 
  Clock, 
  Sparkles,
  Settings,
  Calendar,
  AlertCircle
} from 'lucide-react';

type NavTab = 'TODAY' | 'TASKS' | 'HABITS' | 'CALENDAR' | 'GOALS' | 'REPORTS' | 'SETTINGS';

// Helper to flatten nested goals arrays and sanitize objects
export function flattenAndSanitizeGoals(raw: any[]): Goal[] {
  if (!Array.isArray(raw)) return [];
  const result: Goal[] = [];
  function walk(item: any) {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach(walk);
    } else if (typeof item === 'object' && item.id && item.title) {
      result.push({
        ...item,
        history: Array.isArray(item.history) ? item.history : [],
      });
    }
  }
  raw.forEach(walk);
  return result;
}

export const App: React.FC = () => {
  // Current Jalali date for calculations
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);

  // --- Persistent State with Safe Fallbacks & Triple-Layer Data Preservation ---
  const [categories, setCategories] = useState<Category[]>(() => {
    return loadFromLocalStorage('javaneh_categories', INITIAL_CATEGORIES);
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = loadFromLocalStorage<any[]>('javaneh_goals', []);
    if (Array.isArray(saved) && saved.length > 0) {
      const clean = flattenAndSanitizeGoals(saved);
      if (clean.length > 0) return clean;
    }
    return getInitialGoals();
  });

  const [tasks, setTasks] = useState<AppTask[]>(() => {
    const saved = loadFromLocalStorage<AppTask[]>('javaneh_tasks', []);
    if (Array.isArray(saved)) {
      return saved.map((t: AppTask) => ({
        ...t,
        repeatDaysOfWeek: t.repeatDaysOfWeek || [],
      }));
    }
    return getInitialTasks();
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = loadFromLocalStorage<Habit[]>('javaneh_habits', []);
    if (Array.isArray(saved)) {
      return saved.map((h: Habit) => ({
        ...h,
        targetDaysOfWeek: h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        completionHistory: h.completionHistory || {},
      }));
    }
    return getInitialHabits();
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return loadFromLocalStorage<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_USER_PROFILE);
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    return loadFromLocalStorage<ReminderSettings>(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDER_SETTINGS);
  });

  const [activeReminderTask, setActiveReminderTask] = useState<AppTask | null>(null);
  const [activeReminderHolidayNotice, setActiveReminderHolidayNotice] = useState<string | null>(null);

  const [isStorageReady, setIsStorageReady] = useState(false);
  const isInitialMount = useRef(true);

  // Initial Boot: Check server file storage (/api/data), IndexedDB, and LocalStorage Snapshots
  useEffect(() => {
    async function hydrateFromDurableStore() {
      try {
        // 1. Fetch from server storage
        const serverData = await fetchServerData();

        // 2. Fetch from IndexedDB
        const idbGoals = await loadFromIndexedDB<Goal[]>('goals');
        const idbTasks = await loadFromIndexedDB<AppTask[]>('tasks');
        const idbHabits = await loadFromIndexedDB<Habit[]>('habits');
        const idbCats = await loadFromIndexedDB<Category[]>('categories');
        const idbProfile = await loadFromIndexedDB<UserProfile>('userProfile');
        const idbReminders = await loadFromIndexedDB<ReminderSettings>('reminderSettings');

        // 3. Fetch from LocalStorage primary & snapshots
        const lsCats = loadFromLocalStorage<Category[]>('javaneh_categories', []);
        const lsGoals = loadFromLocalStorage<Goal[]>('javaneh_goals', []);
        const lsTasks = loadFromLocalStorage<AppTask[]>('javaneh_tasks', []);
        const lsHabits = loadFromLocalStorage<Habit[]>('javaneh_habits', []);
        const lsProfile = loadFromLocalStorage<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_USER_PROFILE);
        const lsReminders = loadFromLocalStorage<ReminderSettings>(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDER_SETTINGS);

        const snapshots = getLocalSnapshots();
        const snapGoals = snapshots.flatMap(s => s.payload.goals || []);
        const snapTasks = snapshots.flatMap(s => s.payload.tasks || []);
        const snapHabits = snapshots.flatMap(s => s.payload.habits || []);

        // 4. Safe Non-Destructive Union Merge:
        // Prioritize: (snapshots / initial) -> (IndexedDB) -> (LocalStorage) -> (Server)
        // If an item exists in ANY of these sources, it is preserved!
        const mergedCategories = mergeEntitiesById(
          INITIAL_CATEGORIES,
          idbCats,
          lsCats,
          serverData?.categories
        );

        const mergedGoals = flattenAndSanitizeGoals(
          mergeEntitiesById(
            snapGoals,
            idbGoals,
            lsGoals,
            serverData?.goals
          )
        );

        const mergedTasks = mergeEntitiesById(
          snapTasks,
          idbTasks,
          lsTasks,
          serverData?.tasks
        ).map((t: AppTask) => ({
          ...t,
          repeatDaysOfWeek: t.repeatDaysOfWeek || [],
        }));

        const mergedHabits = mergeEntitiesById(
          snapHabits,
          idbHabits,
          lsHabits,
          serverData?.habits
        ).map((h: Habit) => ({
          ...h,
          targetDaysOfWeek: h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
          completionHistory: h.completionHistory || {},
        }));

        // Find any preserved profile from snapshots, indexedDB, localStorage, or server
        const snapProfile = snapshots.find(s => s.payload.userProfile?.name && s.payload.userProfile.name !== DEFAULT_USER_PROFILE.name)?.payload.userProfile
          || snapshots.find(s => Boolean(s.payload.userProfile))?.payload.userProfile;

        const candidateProfiles = [
          DEFAULT_USER_PROFILE,
          (serverData as any)?.userProfile,
          snapProfile,
          idbProfile,
          lsProfile,
        ].filter(Boolean);

        const mergedProfile: UserProfile = candidateProfiles.reduce((acc, curr) => {
          if (!curr || typeof curr !== 'object') return acc;
          return {
            ...acc,
            name: curr.name && curr.name !== DEFAULT_USER_PROFILE.name ? curr.name : (acc.name || curr.name),
            title: curr.title && curr.title !== DEFAULT_USER_PROFILE.title ? curr.title : (acc.title || curr.title),
            avatarUrl: curr.avatarUrl && curr.avatarUrl !== DEFAULT_USER_PROFILE.avatarUrl ? curr.avatarUrl : (acc.avatarUrl || curr.avatarUrl),
            bio: curr.bio && curr.bio !== DEFAULT_USER_PROFILE.bio ? curr.bio : (acc.bio || curr.bio),
          };
        }, DEFAULT_USER_PROFILE);

        const finalProfile = mergedProfile;

        const finalReminders = (lsReminders && typeof lsReminders === 'object' && lsReminders.selectedSoundId)
          ? lsReminders
          : idbReminders || (serverData as any)?.reminderSettings || DEFAULT_REMINDER_SETTINGS;

        // 5. Update state
        if (mergedCategories.length > 0) setCategories(mergedCategories);
        if (mergedGoals.length > 0) setGoals(mergedGoals);
        if (mergedTasks.length > 0) setTasks(mergedTasks);
        if (mergedHabits.length > 0) setHabits(mergedHabits);
        if (finalProfile) setUserProfile(finalProfile);
        if (finalReminders) setReminderSettings(finalReminders);

        // 6. Write back the consolidated union to all stores
        saveToLocalStorage('javaneh_categories', mergedCategories);
        saveToLocalStorage('javaneh_goals', mergedGoals);
        saveToLocalStorage('javaneh_tasks', mergedTasks);
        saveToLocalStorage('javaneh_habits', mergedHabits);
        saveToLocalStorage(STORAGE_KEYS.PROFILE, finalProfile);
        saveToLocalStorage(STORAGE_KEYS.REMINDERS, finalReminders);

        await saveToIndexedDB('categories', mergedCategories);
        await saveToIndexedDB('goals', mergedGoals);
        await saveToIndexedDB('tasks', mergedTasks);
        await saveToIndexedDB('habits', mergedHabits);
        await saveToIndexedDB('userProfile', finalProfile);
        await saveToIndexedDB('reminderSettings', finalReminders);

        saveLocalSnapshot({
          categories: mergedCategories,
          goals: mergedGoals,
          tasks: mergedTasks,
          habits: mergedHabits,
        });

        // 7. Sync consolidated state to server disk
        const currentData = {
          categories: mergedCategories,
          goals: mergedGoals,
          tasks: mergedTasks,
          habits: mergedHabits,
          userProfile: finalProfile,
          reminderSettings: finalReminders,
        };
        triggerServerSync(currentData, 300);
      } catch (err) {
        console.warn('Storage hydration notice:', err);
      } finally {
        setIsStorageReady(true);
      }
    }

    hydrateFromDurableStore();
  }, []);

  // Save changes to localStorage, IndexedDB, and Server API
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 1. LocalStorage
    saveToLocalStorage('javaneh_categories', categories);
    saveToLocalStorage('javaneh_goals', goals);
    saveToLocalStorage('javaneh_tasks', tasks);
    saveToLocalStorage('javaneh_habits', habits);
    saveToLocalStorage(STORAGE_KEYS.PROFILE, userProfile);
    saveToLocalStorage(STORAGE_KEYS.REMINDERS, reminderSettings);

    // 2. IndexedDB
    saveToIndexedDB('categories', categories);
    saveToIndexedDB('goals', goals);
    saveToIndexedDB('tasks', tasks);
    saveToIndexedDB('habits', habits);
    saveToIndexedDB('userProfile', userProfile);
    saveToIndexedDB('reminderSettings', reminderSettings);

    // 3. Persistent Server File
    triggerServerSync({
      categories,
      goals,
      tasks,
      habits,
      userProfile,
      reminderSettings,
    }, 400);
  }, [categories, goals, tasks, habits, userProfile, reminderSettings]);

  // --- Periodic Reminder Check Interval ---
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDayOfWeek = getDayOfWeek(today);
      const holidayInfo = isDateHoliday(today);

      // Find tasks that are due and not yet notified recently
      for (const task of tasks) {
        if (task.isCompleted) continue;

        // 1. Check proactive advance reminder for tasks scheduled on holidays
        if (reminderSettings.notifyBeforeHolidayTasks && holidayInfo.isHoliday) {
          const leadMinutes = reminderSettings.holidayLeadMinutes || 15;
          if (isTaskHolidayAdvanceReminderDue(task, todayStr, currentHHMM, currentDayOfWeek, holidayInfo.isHoliday, leadMinutes)) {
            const holidayTitle = holidayInfo.title || 'تعطیل رسمی';
            triggerReminderAlarm(
              task,
              reminderSettings,
              () => {
                setActiveReminderHolidayNotice(holidayTitle);
                setActiveReminderTask(task);
              },
              holidayTitle
            );

            const slotKey = `holiday-advance-${todayStr} ${currentHHMM}`;
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastNotifiedAt: slotKey } : t));
            setActiveReminderHolidayNotice(holidayTitle);
            setActiveReminderTask(task);
            break;
          }
        }

        // 2. Standard due-time reminder check
        if (!task.reminderEnabled && !task.isImportant) continue;

        if (isTaskReminderDue(task, todayStr, currentHHMM, currentDayOfWeek)) {
          // Trigger reminder notification and audio alarm
          triggerReminderAlarm(task, reminderSettings, () => {
            setActiveReminderHolidayNotice(null);
            setActiveReminderTask(task);
          });

          // Mark task as notified right now to prevent repeated ringing in the same minute
          const slotKey = `${todayStr} ${currentHHMM}`;
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastNotifiedAt: slotKey } : t));

          // Set active reminder task for the on-screen alert modal
          setActiveReminderHolidayNotice(null);
          setActiveReminderTask(task);
          break; // Ring one at a time
        }
      }
    };

    // Check on startup / task updates
    checkReminders();

    const intervalId = setInterval(checkReminders, 15000);
    return () => clearInterval(intervalId);
  }, [tasks, reminderSettings, todayStr, today.year, today.month, today.day, today]);

  const handleSaveUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveToLocalStorage(STORAGE_KEYS.PROFILE, updated);
    saveToIndexedDB('userProfile', updated);
    triggerServerSync({
      categories,
      goals,
      tasks,
      habits,
      userProfile: updated,
      reminderSettings,
    }, 100);
  };

  const handleSaveReminderSettings = (updated: ReminderSettings) => {
    setReminderSettings(updated);
    saveToLocalStorage(STORAGE_KEYS.REMINDERS, updated);
    saveToIndexedDB('reminderSettings', updated);
    triggerServerSync({
      categories,
      goals,
      tasks,
      habits,
      userProfile,
      reminderSettings: updated,
    }, 100);
  };

  const handleDismissReminder = () => {
    stopAllAlarmSounds();
    // If auto re-notify is configured and user just closed the popup without completing or explicit snooze:
    if (activeReminderTask && (reminderSettings.autoReNotifyCount ?? 0) > 0) {
      const currentCount = activeReminderTask.snoozeCount ?? 0;
      const maxCount = reminderSettings.autoReNotifyCount ?? 2;
      const interval = reminderSettings.autoReNotifyIntervalMinutes || reminderSettings.snoozeIntervalMinutes || 10;
      if (currentCount < maxCount) {
        const nextTime = calculateSnoozeTime(interval);
        setTasks(prev => prev.map(t => {
          if (t.id === activeReminderTask.id) {
            return {
              ...t,
              nextSnoozeAt: nextTime,
              snoozeCount: currentCount + 1,
              lastNotifiedAt: null,
            };
          }
          return t;
        }));
      }
    }
    setActiveReminderTask(null);
    setActiveReminderHolidayNotice(null);
  };

  const handleCompleteReminderTask = (taskId: string) => {
    stopAllAlarmSounds();
    handleToggleTask(taskId);
    // Clear snooze state upon task completion
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          nextSnoozeAt: null,
          snoozeCount: 0,
        };
      }
      return t;
    }));
    setActiveReminderTask(null);
    setActiveReminderHolidayNotice(null);
  };

  const handleSnoozeReminder = (taskId: string, minutes: number) => {
    stopAllAlarmSounds();
    const snoozeTime = calculateSnoozeTime(minutes);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          nextSnoozeAt: snoozeTime,
          reminderTime: snoozeTime,
          snoozeCount: (t.snoozeCount || 0) + 1,
          lastNotifiedAt: null, // allow notifying at new snoozed time
        };
      }
      return t;
    }));
    setActiveReminderTask(null);
    setActiveReminderHolidayNotice(null);
  };

  // --- Active Tab ---
  const [currentTab, setCurrentTab] = useState<NavTab>('TODAY');

  // --- Modals State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AppTask | null>(null);
  const [isDuplicateTask, setIsDuplicateTask] = useState(false);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDuplicateHabit, setIsDuplicateHabit] = useState(false);

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
    initialElapsedSeconds?: number;
    currentProgressPercent?: number;
    entityType?: 'TASK' | 'HABIT';
    taskId?: string;
    habitId?: string;
    onDone?: (elapsedSeconds: number, isFullyCompleted: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    minutes: 25,
  });

  // Direct Tasks Backup and APK Modal State
  const [isTasksBackupModalOpen, setIsTasksBackupModalOpen] = useState(false);
  const [isApkDownloadModalOpen, setIsApkDownloadModalOpen] = useState(false);

  // --- Plant Growth State Calculation ---
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
          isArchived: nextDone ? t.isArchived : false,
        };
      }
      return t;
    }));
  };

  const handleArchiveTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          isArchived: true,
        };
      }
      return t;
    }));
  };

  const handleRestoreTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          isArchived: false,
          completedAt: todayStr,
        };
      }
      return t;
    }));
  };

  const handleClearArchivedTasks = (taskIds?: string[]) => {
    setTasks(prev => {
      if (taskIds && taskIds.length > 0) {
        const idSet = new Set(taskIds);
        return prev.filter(t => !idSet.has(t.id));
      }
      const oneMonthAgoDate = addDaysJalali(today, -30);
      const oneMonthAgoStr = jalaliToFormattedString(oneMonthAgoDate);
      return prev.filter(t => {
        if (t.isArchived === true) return false;
        if (t.isCompleted) {
          const dateStr = t.completedAt || t.dueDate;
          if (dateStr && dateStr < oneMonthAgoStr && t.isArchived !== false) {
            return false;
          }
        }
        return true;
      });
    });
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

  const handleUpdateGoalProgress = (goalId: string, manualProgress: number | null, isManualActive: boolean) => {
    const timestampNow = getCurrentPersianDateTimeString();
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'EDITED',
          description: isManualActive 
            ? `تنظیم دستی درصد پیشرفت به ${toPersianDigits(manualProgress ?? 0)}٪` 
            : 'تغییر شیوه ارزیابی به محاسبه خودکار سیستمی',
        };
        const updated: Goal = {
          ...g,
          manualProgress,
          isManualProgressActive: isManualActive,
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

  const handleTransferSeasonItems = (fromGoalId: string, targetSeasonIndex?: number) => {
    const fromGoal = goals.find(g => g.id === fromGoalId);
    if (!fromGoal) return;

    const seasonNames = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
    const currentFromSeasonIdx = fromGoal.seasonIndex ?? 0;
    const nextSeasonIdx = targetSeasonIndex !== undefined ? targetSeasonIndex : (currentFromSeasonIdx + 1) % 4;
    const targetYear = nextSeasonIdx === 0 && currentFromSeasonIdx === 3 ? fromGoal.year + 1 : fromGoal.year;

    // Look for existing target seasonal goal under the same parent
    let targetGoal = goals.find(g => 
      (g.parentId === fromGoal.parentId || (!g.parentId && !fromGoal.parentId)) &&
      g.period === 'SEASONAL' && 
      g.seasonIndex === nextSeasonIdx &&
      g.year === targetYear
    );

    let actualTargetGoalId = targetGoal?.id;

    if (!targetGoal) {
      actualTargetGoalId = `goal-season-${Date.now()}`;
      const newTarget: Goal = {
        id: actualTargetGoalId,
        title: `هدف فصل ${seasonNames[nextSeasonIdx]} (ادامه ${fromGoal.title})`,
        description: `انتقال خودکار تسک‌ها و عادات از فصل ${seasonNames[currentFromSeasonIdx]}`,
        year: targetYear,
        period: 'SEASONAL',
        status: 'IN_PROGRESS',
        startDate: todayStr,
        seasonIndex: nextSeasonIdx,
        parentId: fromGoal.parentId,
        categoryId: fromGoal.categoryId,
        plantType: fromGoal.plantType,
        createdAt: todayStr,
        history: [{
          id: `hist-${Date.now()}`,
          timestamp: getCurrentPersianDateTimeString(),
          action: 'CREATED',
          description: `ایجاد خودکار هدف فصل ${seasonNames[nextSeasonIdx]} برای دریافت فعالیت‌های فصل قبل`,
        }],
      };
      setGoals(prev => [newTarget, ...prev]);
    }

    const timestampNow = getCurrentPersianDateTimeString();

    // 1. Transfer incomplete tasks
    let movedTasksCount = 0;
    setTasks(prev => prev.map(t => {
      if (t.goalId === fromGoalId && !t.isCompleted) {
        movedTasksCount++;
        return {
          ...t,
          goalId: actualTargetGoalId,
          notes: t.notes ? `${t.notes}\n[انتقال از فصل ${seasonNames[currentFromSeasonIdx]}]` : `[انتقال از فصل ${seasonNames[currentFromSeasonIdx]}]`,
        };
      }
      return t;
    }));

    // 2. Transfer habits
    let movedHabitsCount = 0;
    setHabits(prev => prev.map(h => {
      if (h.goalId === fromGoalId) {
        movedHabitsCount++;
        return {
          ...h,
          goalId: actualTargetGoalId,
        };
      }
      return h;
    }));

    // 3. Update history on source goal
    setGoals(prev => prev.map(g => {
      if (g.id === fromGoalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now() + 1}`,
          timestamp: timestampNow,
          action: 'EDITED',
          description: `انتقال ${toPersianDigits(movedTasksCount)} تسک انجام‌نشده و ${toPersianDigits(movedHabitsCount)} عادت به فصل ${seasonNames[nextSeasonIdx]}`,
        };
        return {
          ...g,
          history: [entry, ...(g.history || [])],
        };
      }
      return g;
    }));
  };

  const handleTransferGoalItems = (
    fromGoalId: string,
    targetGoalId: string,
    options: { transferTasks: boolean; transferHabits: boolean }
  ) => {
    const fromGoal = goals.find(g => g.id === fromGoalId);
    const targetGoal = goals.find(g => g.id === targetGoalId);
    if (!fromGoal || !targetGoal) return;

    const timestampNow = getCurrentPersianDateTimeString();
    let movedTasksCount = 0;
    let movedHabitsCount = 0;

    if (options.transferTasks) {
      setTasks(prev => prev.map(t => {
        if (t.goalId === fromGoalId && !t.isCompleted) {
          movedTasksCount++;
          return {
            ...t,
            goalId: targetGoalId,
            notes: t.notes 
              ? `${t.notes}\n[انتقال از هدف «${fromGoal.title}»]` 
              : `[انتقال از هدف «${fromGoal.title}»]`,
          };
        }
        return t;
      }));
    }

    if (options.transferHabits) {
      setHabits(prev => prev.map(h => {
        if (h.goalId === fromGoalId) {
          movedHabitsCount++;
          return {
            ...h,
            goalId: targetGoalId,
          };
        }
        return h;
      }));
    }

    // Add history log on both fromGoal and targetGoal
    setGoals(prev => prev.map(g => {
      if (g.id === fromGoalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'EDITED',
          description: `انتقال ${toPersianDigits(movedTasksCount)} تسک و ${toPersianDigits(movedHabitsCount)} عادت به هدف «${targetGoal.title}»`,
        };
        return { ...g, history: [entry, ...(g.history || [])] };
      }
      if (g.id === targetGoalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now() + 1}`,
          timestamp: timestampNow,
          action: 'EDITED',
          description: `دریافت ${toPersianDigits(movedTasksCount)} تسک و ${toPersianDigits(movedHabitsCount)} عادت از هدف «${fromGoal.title}»`,
        };
        return { ...g, history: [entry, ...(g.history || [])] };
      }
      return g;
    }));
  };

  const handleCreateTargetAndTransfer = (
    fromGoal: Goal,
    targetTitle: string,
    targetPeriod: 'SEASONAL' | 'MONTHLY' | 'ANNUAL',
    targetSeasonIndex?: number,
    targetMonthIndex?: number,
    targetYear?: number
  ) => {
    const newGoalId = `goal-${Date.now()}`;
    const timestampNow = getCurrentPersianDateTimeString();
    const newTargetGoal: Goal = {
      id: newGoalId,
      title: targetTitle,
      description: `ایجاد شده برای ادامه فعالیت‌های «${fromGoal.title}»`,
      year: targetYear || fromGoal.year,
      period: targetPeriod,
      status: 'IN_PROGRESS',
      startDate: todayStr,
      seasonIndex: targetSeasonIndex,
      monthIndex: targetMonthIndex,
      parentId: targetPeriod === 'ANNUAL' ? null : fromGoal.parentId,
      categoryId: fromGoal.categoryId,
      plantType: fromGoal.plantType,
      createdAt: todayStr,
      history: [{
        id: `hist-${Date.now()}`,
        timestamp: timestampNow,
        action: 'CREATED',
        description: `ایجاد هدف جدید و انتقال فعالیت‌ها از «${fromGoal.title}»`,
      }],
    };

    setGoals(prev => [newTargetGoal, ...prev]);

    // Transfer tasks and habits to new target
    handleTransferGoalItems(fromGoal.id, newGoalId, { transferTasks: true, transferHabits: true });
  };

  const handleCloseGoalPendingItems = (goalId: string) => {
    const fromGoal = goals.find(g => g.id === goalId);
    if (!fromGoal) return;

    const timestampNow = getCurrentPersianDateTimeString();
    let closedTasksCount = 0;

    // Mark pending tasks of this goal as completed
    setTasks(prev => prev.map(t => {
      if (t.goalId === goalId && !t.isCompleted) {
        closedTasksCount++;
        return {
          ...t,
          isCompleted: true,
          completionDate: todayStr,
          notes: t.notes 
            ? `${t.notes}\n[بسته‌شده در پایان دوره]` 
            : `[بسته‌شده در پایان دوره]`,
        };
      }
      return t;
    }));

    // Update goal history and mark status as COMPLETED
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const entry: GoalHistoryEntry = {
          id: `hist-${Date.now()}`,
          timestamp: timestampNow,
          action: 'STATUS_CHANGED',
          description: `خاتمه دوره: بستن ${toPersianDigits(closedTasksCount)} تسک باقی‌مانده و تکمیل هدف`,
        };
        return {
          ...g,
          status: 'COMPLETED',
          history: [entry, ...(g.history || [])],
        };
      }
      return g;
    }));
  };

  const handleToggleCloseHabit = (habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const willClose = !h.isClosed;
        return {
          ...h,
          isClosed: willClose,
          closedAt: willClose ? todayStr : undefined,
        };
      }
      return h;
    }));
  };

  const handleTransferSingleTask = (
    taskId: string, 
    targetGoalId: string | null, 
    closeTask: boolean, 
    noteAppend?: string
  ) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (closeTask) {
          return {
            ...t,
            isCompleted: true,
            completionDate: todayStr,
            notes: noteAppend ? (t.notes ? `${t.notes}\n${noteAppend}` : noteAppend) : t.notes,
          };
        }
        return {
          ...t,
          goalId: targetGoalId,
          notes: noteAppend ? (t.notes ? `${t.notes}\n${noteAppend}` : noteAppend) : t.notes,
        };
      }
      return t;
    }));
  };

  const handleCreateSeasonalGoalAndTransferTask = (
    taskId: string, 
    seasonIdx: number, 
    year: number, 
    title: string,
    parentAnnualId?: string | null, 
    categoryId?: string
  ) => {
    const newGoalId = `goal-season-${Date.now()}`;
    const timestampNow = getCurrentPersianDateTimeString();
    const newTargetGoal: Goal = {
      id: newGoalId,
      title: title,
      description: `هدف فصل برای دریافت تسک‌های انتقالی`,
      year: year,
      period: 'SEASONAL',
      status: 'IN_PROGRESS',
      startDate: todayStr,
      seasonIndex: seasonIdx,
      parentId: parentAnnualId || null,
      categoryId: categoryId || categories[0]?.id,
      createdAt: todayStr,
      history: [{
        id: `hist-${Date.now()}`,
        timestamp: timestampNow,
        action: 'CREATED',
        description: `ایجاد هدف فصلی جدید برای دریافت تسک‌های انتقالی`,
      }],
    };

    setGoals(prev => [newTargetGoal, ...prev]);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          goalId: newGoalId,
          notes: t.notes ? `${t.notes}\n[انتقال به هدف «${title}»]` : `[انتقال به هدف «${title}»]`,
        };
      }
      return t;
    }));
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
  const handleSaveAnnualWizard = (
    annualGoal: Goal, 
    intermediateGoals?: Goal[] | Goal, 
    microTask?: AppTask, 
    microHabit?: Habit
  ) => {
    setGoals(prev => {
      const added: Goal[] = [annualGoal];
      if (Array.isArray(intermediateGoals)) {
        added.push(...intermediateGoals);
      } else if (intermediateGoals) {
        added.push(intermediateGoals);
      }
      return flattenAndSanitizeGoals([...added, ...prev]);
    });

    if (microTask) {
      setTasks(prev => [microTask, ...prev]);
    }

    if (microHabit) {
      setHabits(prev => [microHabit, ...prev]);
    }

    // Switch to GOALS tab to see the newly created hierarchy
    setCurrentTab('GOALS');
  };

  // Helper to open task modal pre-filled for a specific goal
  const handleNewTaskForGoal = (goalId: string) => {
    const parentGoal = goals.find(g => g.id === goalId);
    setEditingTask({
      id: `task-${Date.now()}`,
      title: '',
      notes: '',
      categoryId: parentGoal?.categoryId || categories[0]?.id || 'cat-work',
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

  // Helper to open habit modal pre-filled for a specific goal
  const handleNewHabitForGoal = (goalId: string) => {
    const parentGoal = goals.find(g => g.id === goalId);
    const parentCat = parentGoal ? categories.find(c => c.id === parentGoal.categoryId) : undefined;
    setEditingHabit({
      id: `habit-${Date.now()}`,
      title: '',
      categoryId: parentGoal?.categoryId || categories[0]?.id || 'cat-work',
      plantType: parentGoal?.plantType || parentCat?.plantType || 'بونسای',
      frequency: 'DAILY',
      targetDaysPerWeek: 7,
      selectedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      currentStreak: 0,
      longestStreak: 0,
      completionHistory: {},
      goalId,
      timerMinutes: 15,
    });
    setIsHabitModalOpen(true);
  };

  // Helper to open new goal modal pre-filled with parent or period
  const handleOpenNewGoalModal = (
    parentId?: string | null, 
    period?: 'ANNUAL' | 'SEASONAL' | 'MONTHLY',
    seasonIndex?: number
  ) => {
    const foundParent = parentId ? goals.find(g => g.id === parentId) : null;
    const initialCategory = foundParent?.categoryId || categories[0]?.id || 'cat-work';
    const initialCatObj = categories.find(c => c.id === initialCategory);
    const seasonNames = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

    let prefillTitle = '';
    if (foundParent) {
      const targetSeasonIdx = seasonIndex !== undefined ? seasonIndex : foundParent.seasonIndex;
      if (period === 'SEASONAL' && targetSeasonIdx !== undefined) {
        prefillTitle = `گام فصل ${seasonNames[targetSeasonIdx]}: ${foundParent.title}`;
      } else if (period === 'SEASONAL') {
        prefillTitle = `گام فصلی: ${foundParent.title}`;
      } else if (period === 'MONTHLY') {
        prefillTitle = `گام ماهانه: ${foundParent.title}`;
      }
    }

    setEditingGoal({
      id: '', // Empty ID ensures it is treated as a clean new goal
      title: prefillTitle,
      description: '',
      visionWhy: '',
      year: foundParent?.year || today.year,
      period: period || (parentId ? 'SEASONAL' : 'ANNUAL'),
      seasonIndex: seasonIndex !== undefined ? seasonIndex : foundParent?.seasonIndex,
      status: 'IN_PROGRESS',
      startDate: todayStr,
      parentId: parentId || null,
      categoryId: initialCategory,
      plantType: foundParent?.plantType || initialCatObj?.plantType || 'بونسای',
      history: [],
      createdAt: todayStr,
    });
    setIsGoalModalOpen(true);
  };

  // Category management handlers for Settings
  const handleSaveCategory = (cat: Category) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cat;
        return next;
      }
      return [...prev, cat];
    });
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) return;
    const fallbackCat = categories.find(c => c.id !== catId)?.id || 'cat-work';
    setCategories(prev => prev.filter(c => c.id !== catId));
    setGoals(prev => prev.map(g => g.categoryId === catId ? { ...g, categoryId: fallbackCat } : g));
    setTasks(prev => prev.map(t => t.categoryId === catId ? { ...t, categoryId: fallbackCat } : t));
    setHabits(prev => prev.map(h => h.categoryId === catId ? { ...h, categoryId: fallbackCat } : h));
  };

  const handleResetCategories = () => {
    setCategories(INITIAL_CATEGORIES);
  };

  const handleImportAllData = (
    data: { 
      categories?: Category[]; 
      goals?: Goal[]; 
      tasks?: AppTask[]; 
      habits?: Habit[];
      userProfile?: UserProfile;
      reminderSettings?: ReminderSettings;
    },
    mode: 'REPLACE' | 'MERGE' = 'REPLACE'
  ) => {
    let nextCategories = categories;
    let nextGoals = goals;
    let nextTasks = tasks;
    let nextHabits = habits;

    if (mode === 'REPLACE') {
      nextCategories = data.categories && data.categories.length > 0 ? data.categories : INITIAL_CATEGORIES;
      nextGoals = data.goals ? flattenAndSanitizeGoals(data.goals) : [];
      nextTasks = data.tasks ? data.tasks.map(t => ({ ...t, repeatDaysOfWeek: t.repeatDaysOfWeek || [] })) : [];
      nextHabits = data.habits ? data.habits.map(h => ({
        ...h,
        targetDaysOfWeek: h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        completionHistory: h.completionHistory || {},
      })) : [];

      resetLocalSnapshotsWithData({
        categories: nextCategories,
        goals: nextGoals,
        tasks: nextTasks,
        habits: nextHabits,
      });
    } else {
      // MERGE mode
      if (data.categories && data.categories.length > 0) {
        nextCategories = mergeEntitiesById(categories, data.categories);
      }
      if (data.goals && data.goals.length > 0) {
        nextGoals = flattenAndSanitizeGoals(mergeEntitiesById(goals, data.goals));
      }
      if (data.tasks && data.tasks.length > 0) {
        nextTasks = mergeEntitiesById(tasks, data.tasks).map(t => ({
          ...t,
          repeatDaysOfWeek: t.repeatDaysOfWeek || [],
        }));
      }
      if (data.habits && data.habits.length > 0) {
        nextHabits = mergeEntitiesById(habits, data.habits).map(h => ({
          ...h,
          targetDaysOfWeek: h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
          completionHistory: h.completionHistory || {},
        }));
      }

      saveLocalSnapshot({
        categories: nextCategories,
        goals: nextGoals,
        tasks: nextTasks,
        habits: nextHabits,
      });
    }

    setCategories(nextCategories);
    setGoals(nextGoals);
    setTasks(nextTasks);
    setHabits(nextHabits);

    // Explicitly write to persistent stores immediately
    saveToLocalStorage('javaneh_categories', nextCategories);
    saveToLocalStorage('javaneh_goals', nextGoals);
    saveToLocalStorage('javaneh_tasks', nextTasks);
    saveToLocalStorage('javaneh_habits', nextHabits);

    saveToIndexedDB('categories', nextCategories);
    saveToIndexedDB('goals', nextGoals);
    saveToIndexedDB('tasks', nextTasks);
    saveToIndexedDB('habits', nextHabits);

    if (data.userProfile) {
      setUserProfile(data.userProfile);
      saveToLocalStorage(STORAGE_KEYS.PROFILE, data.userProfile);
      saveToIndexedDB('userProfile', data.userProfile);
    }
    if (data.reminderSettings) {
      setReminderSettings(data.reminderSettings);
      saveToLocalStorage(STORAGE_KEYS.REMINDERS, data.reminderSettings);
      saveToIndexedDB('reminderSettings', data.reminderSettings);
    }

    triggerServerSync({
      categories: nextCategories,
      goals: nextGoals,
      tasks: nextTasks,
      habits: nextHabits,
      userProfile: data.userProfile || userProfile,
      reminderSettings: data.reminderSettings || reminderSettings,
    }, 100);
  };

  // Dedicated Tasks-only import handler (Fast Task Restore)
  const handleImportTasksOnly = (importedTasks: AppTask[], mode: 'REPLACE' | 'MERGE' = 'MERGE') => {
    let nextTasks: AppTask[] = [];
    if (mode === 'REPLACE') {
      nextTasks = importedTasks.map(t => ({ ...t, repeatDaysOfWeek: t.repeatDaysOfWeek || [] }));
    } else {
      nextTasks = mergeEntitiesById(tasks, importedTasks).map(t => ({
        ...t,
        repeatDaysOfWeek: t.repeatDaysOfWeek || [],
      }));
    }

    setTasks(nextTasks);
    saveToLocalStorage('javaneh_tasks', nextTasks);
    saveToIndexedDB('tasks', nextTasks);
    saveLocalSnapshot({
      categories,
      goals,
      tasks: nextTasks,
      habits,
      userProfile,
      reminderSettings,
    });

    triggerServerSync({
      categories,
      goals,
      tasks: nextTasks,
      habits,
      userProfile,
      reminderSettings,
    }, 100);
  };

  // --- Timer Helper ---
  const openTimer = (
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
    setTimerConfig({
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
  };

  const handleTimerComplete = (elapsedSeconds: number, isFullyCompleted: boolean) => {
    const timestampNow = new Date().toISOString();
    const targetSeconds = (timerConfig.minutes || 25) * 60;
    const progressPct = isFullyCompleted 
      ? 100 
      : Math.min(100, Math.round((elapsedSeconds / Math.max(1, targetSeconds)) * 100));

    // Handle Task Focus Session
    if (timerConfig.taskId) {
      const taskId = timerConfig.taskId;
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const session: FocusSessionLog = {
            id: `session-${Date.now()}`,
            dateStr: todayStr,
            timestamp: timestampNow,
            durationSeconds: elapsedSeconds,
            targetSeconds,
            completed100: isFullyCompleted || progressPct >= 100,
            progressPercent: progressPct,
          };
          const nextSessions = [session, ...(t.focusSessions || [])];
          return {
            ...t,
            timerSecondsElapsed: elapsedSeconds,
            focusProgressPercent: progressPct,
            focusSessions: nextSessions,
            isCompleted: isFullyCompleted ? true : (t.isCompleted || false),
            completedAt: isFullyCompleted ? todayStr : (t.isCompleted ? t.completedAt : null),
          };
        }
        return t;
      }));
    }

    // Handle Habit Focus Session
    if (timerConfig.habitId) {
      const habitId = timerConfig.habitId;
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          const session: FocusSessionLog = {
            id: `session-${Date.now()}`,
            dateStr: todayStr,
            timestamp: timestampNow,
            durationSeconds: elapsedSeconds,
            targetSeconds,
            completed100: isFullyCompleted || progressPct >= 100,
            progressPercent: progressPct,
          };
          const nextSessions = [session, ...(h.focusSessions || [])];
          const nextDailyProgress = { ...(h.dailyProgressHistory || {}), [todayStr]: progressPct };
          const nextDailyElapsed = { ...(h.dailyElapsedSeconds || {}), [todayStr]: elapsedSeconds };
          const nextCompletion = { ...h.completionHistory };
          if (isFullyCompleted) {
            nextCompletion[todayStr] = true;
          }

          return {
            ...h,
            dailyProgressHistory: nextDailyProgress,
            dailyElapsedSeconds: nextDailyElapsed,
            completionHistory: nextCompletion,
            focusSessions: nextSessions,
          };
        }
        return h;
      }));
    }

    // Call custom onDone if provided
    if (timerConfig.onDone) {
      timerConfig.onDone(elapsedSeconds, isFullyCompleted);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F8F9F5] text-[#1A2E1A] flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-emerald-950 tracking-tight">
                جوانه
              </h1>
              <p className="text-[10px] text-gray-400">تسک‌ها، عادات و اهداف سالانه</p>
            </div>

            {/* Main Header Persian Date (Clickable to switch to Persian Calendar) */}
            <button
              type="button"
              onClick={() => setCurrentTab('CALENDAR')}
              title="مشاهده تقویم شمسی و تعطیلات رسمی ایران"
              className={`hidden sm:flex items-center gap-2 mr-3 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'CALENDAR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50/70 border border-emerald-200/70 text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{WEEKDAYS[getDayOfWeek(today)]}، {toPersianDigits(today.day)} {PERSIAN_MONTHS[today.month - 1]} {toPersianDigits(today.year)}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Small mobile date chip */}
            <button
              type="button"
              onClick={() => setCurrentTab('CALENDAR')}
              title="مشاهده تقویم شمسی"
              className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                currentTab === 'CALENDAR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50/70 border border-emerald-200/60 text-emerald-900'
              }`}
            >
              <span>{toPersianDigits(today.day)} {PERSIAN_MONTHS[today.month - 1]}</span>
            </button>

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
              onClick={() => {
                setEditingTask(null);
                setIsDuplicateTask(false);
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
      <main className="flex-1 min-h-0 overflow-y-auto w-full">
        <div className="max-w-4xl w-full mx-auto px-4 py-5">
        {currentTab === 'TODAY' && (
          <TodayScreen
            tasks={tasks}
            habits={habits}
            goals={goals}
            categories={categories}
            plantState={plantState}
            userProfile={userProfile}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={(id) => handleToggleHabitDate(id, todayStr)}
            onToggleHabitDate={handleToggleHabitDate}
            onOpenTimer={(title, mins, cb, opts) => openTimer(title, mins, cb, opts)}
            onOpenNewTask={() => { setEditingTask(null); setIsDuplicateTask(false); setIsTaskModalOpen(true); }}
            onOpenNewHabit={() => { setEditingHabit(null); setIsDuplicateHabit(false); setIsHabitModalOpen(true); }}
            onDuplicateTask={(t) => { setEditingTask(t); setIsDuplicateTask(true); setIsTaskModalOpen(true); }}
            onEditTask={(t) => { setEditingTask(t); setIsDuplicateTask(false); setIsTaskModalOpen(true); }}
          />
        )}

        {currentTab === 'TASKS' && (
          <TasksScreen
            tasks={tasks}
            categories={categories}
            goals={goals}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={(t) => { setEditingTask(t); setIsDuplicateTask(false); setIsTaskModalOpen(true); }}
            onDuplicateTask={(t) => { setEditingTask(t); setIsDuplicateTask(true); setIsTaskModalOpen(true); }}
            onNewTask={() => { setEditingTask(null); setIsDuplicateTask(false); setIsTaskModalOpen(true); }}
            onOpenTimer={(title, mins, cb, opts) => openTimer(title, mins, cb, opts)}
            onTransferTask={handleTransferSingleTask}
            onCreateSeasonalGoalAndTransfer={handleCreateSeasonalGoalAndTransferTask}
            onArchiveTask={handleArchiveTask}
            onRestoreTask={handleRestoreTask}
            onClearArchivedTasks={handleClearArchivedTasks}
            onOpenTasksBackup={() => setIsTasksBackupModalOpen(true)}
          />
        )}

        {currentTab === 'HABITS' && (
          <HabitsScreen
            habits={habits}
            categories={categories}
            goals={goals}
            onToggleHabitDate={handleToggleHabitDate}
            onDeleteHabit={handleDeleteHabit}
            onEditHabit={(h) => { setEditingHabit(h); setIsDuplicateHabit(false); setIsHabitModalOpen(true); }}
            onDuplicateHabit={(h) => { setEditingHabit(h); setIsDuplicateHabit(true); setIsHabitModalOpen(true); }}
            onNewHabit={() => { setEditingHabit(null); setIsDuplicateHabit(false); setIsHabitModalOpen(true); }}
            onOpenTimer={(title, mins, cb, opts) => openTimer(title, mins, cb, opts)}
            onToggleCloseHabit={handleToggleCloseHabit}
          />
        )}

        {currentTab === 'CALENDAR' && (
          <PersianCalendarScreen
            tasks={tasks}
            habits={habits}
            categories={categories}
            goals={goals}
            onToggleTask={handleToggleTask}
            onToggleHabitDate={(id, dateStr) => handleToggleHabitDate(id, dateStr)}
            onOpenTimer={(title, mins, cb, opts) => openTimer(title, mins, cb, opts)}
            onNewTaskWithDate={(dateStr) => {
              setEditingTask(null);
              setIsDuplicateTask(false);
              setIsTaskModalOpen(true);
            }}
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
            onNewHabitForGoal={handleNewHabitForGoal}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={(id) => handleToggleHabitDate(id, todayStr)}
            onOpenTimer={(title, mins, cb) => openTimer(title, mins, cb)}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onTransferSeasonItems={handleTransferSeasonItems}
            onDeleteCategory={handleDeleteCategory}
            onTransferGoalItems={handleTransferGoalItems}
            onCreateTargetAndTransfer={handleCreateTargetAndTransfer}
            onCloseGoalPendingItems={handleCloseGoalPendingItems}
            onTransferTask={handleTransferSingleTask}
            onCreateSeasonalGoalAndTransfer={handleCreateSeasonalGoalAndTransferTask}
            onDuplicateTask={(t) => { setEditingTask(t); setIsDuplicateTask(true); setIsTaskModalOpen(true); }}
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

        {currentTab === 'SETTINGS' && (
          <SettingsScreen
            categories={categories}
            goals={goals}
            tasks={tasks}
            habits={habits}
            userProfile={userProfile}
            reminderSettings={reminderSettings}
            onSaveUserProfile={handleSaveUserProfile}
            onSaveReminderSettings={handleSaveReminderSettings}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetCategories={handleResetCategories}
            onImportTasksOnly={handleImportTasksOnly}
            onImportAllData={handleImportAllData}
          />
        )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100/90 shadow-md">
        <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCurrentTab('TODAY')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'TODAY' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sprout className={`w-5 h-5 ${currentTab === 'TODAY' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">باغچه</span>
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
            onClick={() => setCurrentTab('CALENDAR')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'CALENDAR' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Calendar className={`w-5 h-5 ${currentTab === 'CALENDAR' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">تقویم</span>
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
            <span className="text-[10px]">گزارش</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('SETTINGS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'SETTINGS' ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings className={`w-5 h-5 ${currentTab === 'SETTINGS' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">تنظیمات</span>
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
        key={isTaskModalOpen ? `${editingTask?.id || 'new'}-${isDuplicateTask ? 'dup' : 'edit'}` : 'task-modal-closed'}
        isOpen={isTaskModalOpen}
        task={editingTask}
        categories={categories}
        goals={goals}
        reminderSettings={reminderSettings}
        isDuplicate={isDuplicateTask}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setIsDuplicateTask(false); }}
        onSave={handleSaveTask}
      />

      <HabitModal
        key={isHabitModalOpen ? `${editingHabit?.id || 'new'}-${isDuplicateHabit ? 'dup' : 'edit'}` : 'habit-modal-closed'}
        isOpen={isHabitModalOpen}
        habit={editingHabit}
        categories={categories}
        goals={goals}
        isDuplicate={isDuplicateHabit}
        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); setIsDuplicateHabit(false); }}
        onSave={handleSaveHabit}
      />

      <GoalModal
        key={isGoalModalOpen ? (editingGoal?.id || `new-goal-${editingGoal?.parentId || 'root'}-${editingGoal?.period || 'annual'}-${editingGoal?.seasonIndex ?? 'noseason'}`) : 'goal-modal-closed'}
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
        initialElapsedSeconds={timerConfig.initialElapsedSeconds || 0}
        currentProgressPercent={timerConfig.currentProgressPercent || 0}
        entityType={timerConfig.entityType || 'TASK'}
        onClose={() => setTimerConfig(prev => ({ ...prev, isOpen: false }))}
        onComplete={(elapsed, isFullyCompleted) => {
          handleTimerComplete(elapsed, isFullyCompleted);
        }}
      />

      {/* Active Task Reminder Alarm Alert */}
      <ReminderAlertModal
        isOpen={!!activeReminderTask}
        task={activeReminderTask}
        category={categories.find(c => c.id === activeReminderTask?.categoryId)}
        soundTitle={
          PRESET_ALARM_SOUNDS.find(s => s.id === (activeReminderTask?.customAlarmSound || reminderSettings.selectedSoundId))?.title ||
          reminderSettings.customSounds?.find(s => s.id === activeReminderTask?.customAlarmSound)?.title ||
          'آرامش صبحگاهی'
        }
        reminderSettings={reminderSettings}
        holidayNotice={activeReminderHolidayNotice}
        onDismiss={handleDismissReminder}
        onComplete={handleCompleteReminderTask}
        onSnooze={handleSnoozeReminder}
      />

      {/* Direct Tasks Backup & Restore Modal */}
      <UpdateAndBackupModal
        isOpen={isTasksBackupModalOpen}
        onClose={() => setIsTasksBackupModalOpen(false)}
        initialTab="TASKS_BACKUP"
        tasks={tasks}
        goals={goals}
        habits={habits}
        categories={categories}
        userProfile={userProfile}
        reminderSettings={reminderSettings}
        onImportTasksOnly={handleImportTasksOnly}
        onOpenFullApkDownload={() => setIsApkDownloadModalOpen(true)}
      />

      {/* Direct APK Download Modal */}
      <ApkIntegrityModal
        isOpen={isApkDownloadModalOpen}
        onClose={() => setIsApkDownloadModalOpen(false)}
      />
    </div>
  );
};
