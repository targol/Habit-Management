import React, { useState } from 'react';
import { AppTask, Habit, Category, PlantState, Goal, UserProfile } from '../types';
import { GardenVisual } from './GardenVisual';
import { 
  getTodayJalali, 
  getDayOfWeek,
  toPersianDigits, 
  PERSIAN_MONTHS, 
  WEEKDAYS, 
  isDateHoliday, 
  jalaliToFormattedString,
  getCurrentWeekJalaliDays,
  WEEKDAYS_SHORT,
  compareJalaliDateStrings
} from '../calendar/jalali';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Clock, 
  Plus, 
  Sparkles, 
  Flame, 
  CalendarDays,
  Calendar,
  AlertCircle,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Bell,
  Copy,
  Edit3,
  Sun,
  Droplets,
  Check
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';
import { EntityBadge, EntityIcon } from './EntityIcon';
import { Hourglass, History } from 'lucide-react';
import { FocusHistoryModal } from './FocusHistoryModal';

interface Props {
  tasks: AppTask[];
  habits: Habit[];
  goals: Goal[];
  categories: Category[];
  plantState: PlantState;
  userProfile?: UserProfile;
  onToggleTask: (taskId: string) => void;
  onToggleHabitToday: (habitId: string) => void;
  onToggleHabitDate?: (habitId: string, dateStr: string) => void;
  onOpenTimer: (
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
  ) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
  onDuplicateTask?: (task: AppTask) => void;
  onEditTask?: (task: AppTask) => void;
}

export const TodayScreen: React.FC<Props> = ({
  tasks,
  habits,
  goals,
  categories,
  plantState,
  userProfile,
  onToggleTask,
  onToggleHabitToday,
  onToggleHabitDate,
  onOpenTimer,
  onOpenNewTask,
  onOpenNewHabit,
  onDuplicateTask,
  onEditTask,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentDayOfWeek = getDayOfWeek(today); // 0=شنبه .. 6=جمعه
  const weekdayName = WEEKDAYS[currentDayOfWeek];
  const holidayInfo = isDateHoliday(today);

  const [activeViewMode, setActiveViewMode] = useState<'DAY' | 'WEEK'>('DAY');
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [focusHistoryEntity, setFocusHistoryEntity] = useState<{
    isOpen: boolean;
    title: string;
    entityType: 'TASK' | 'HABIT';
    sessions: any[];
    timerTargetMinutes: number;
    currentElapsedSeconds: number;
    currentProgressPercent: number;
    taskId?: string;
    habitId?: string;
  } | null>(null);

  // 7 days of the current week (from شنبه to جمعه)
  const currentWeekDays = React.useMemo(() => getCurrentWeekJalaliDays(today), [today]);
  const currentWeekDateStrings = React.useMemo(() => currentWeekDays.map(d => d.dateStr), [currentWeekDays]);

  const [holidayPrompt, setHolidayPrompt] = useState<{
    isOpen: boolean;
    title: string;
    holidayTitle: string;
    onConfirm: () => void;
  } | null>(null);

  // Helper: check if a linked goal is in the future
  const isGoalInFuture = (goalId?: string | null): boolean => {
    if (!goalId) return false;
    const g = goals.find(item => item.id === goalId);
    if (!g) return false;
    const gYear = g.year || today.year;
    if (gYear > today.year) return true;
    if (gYear === today.year) {
      if (g.period === 'SEASONAL' && g.seasonIndex !== undefined) {
        const curSeason = Math.floor((today.month - 1) / 3);
        if (g.seasonIndex > curSeason) return true;
      }
      if (g.period === 'MONTHLY' && g.monthIndex !== undefined) {
        if (g.monthIndex > today.month) return true;
      }
    }
    // Also if the goal itself has a future startDate
    if (g.startDate && compareJalaliDateStrings(g.startDate, todayStr) > 0) {
      return true;
    }
    return false;
  };

  // Filter Tasks: ONLY items active for today (respecting start date, deadline range, and future goals)
  const todayTasks = tasks.filter(t => {
    // 0. If task is linked to a future goal, it belongs to the future/upcoming, not today's daily radar
    if (t.goalId && isGoalInFuture(t.goalId)) {
      return false;
    }

    // 0.1 If task has a specific startDate and today is strictly before startDate, it has not started yet
    if (t.startDate && compareJalaliDateStrings(todayStr, t.startDate) < 0) {
      return false;
    }

    // 0.2 If task has monthOfYear specified and current month doesn't match
    if (t.monthOfYear && t.monthOfYear !== today.month) {
      return false;
    }

    // 1. Repeating tasks
    if (t.repeatType === 'DAILY') {
      return true;
    }
    if (t.repeatType === 'WEEKLY') {
      return Array.isArray(t.repeatDaysOfWeek) && t.repeatDaysOfWeek.includes(currentDayOfWeek);
    }

    // 2. If it has a specific due date (deadline):
    if (t.dueDate) {
      const isPastOrTodayDeadline = compareJalaliDateStrings(todayStr, t.dueDate) <= 0;
      // If task has a startDate (or no specific startDate, meaning it has an open deadline window until dueDate)
      // When a task has an upcoming deadline (today <= dueDate), and startDate is today or earlier (or not set),
      // it should remain visible in daily tasks throughout its active window until completed!
      if (!t.isCompleted) {
        // Active pending task within its deadline window or due today
        if (isPastOrTodayDeadline) {
          return true;
        }
        // If overdue (today > dueDate), still show in today's pending list to not get lost
        return true;
      } else {
        // If completed, only show if completed today or due today
        return t.dueDate === todayStr || t.completedAt === todayStr;
      }
    }

    // 3. Tasks without any specific due date or schedule: show in pending pool if not completed
    return !t.isCompleted;
  });

  const activeTodayTasks = todayTasks.filter(t => !t.isCompleted);
  const completedTodayTasks = todayTasks.filter(t => t.isCompleted);

  // Filter Tasks for THIS WEEK: tasks falling in this current week
  const weekTasks = tasks.filter(t => {
    if (t.dueDate && currentWeekDateStrings.includes(t.dueDate)) return true;
    if (t.repeatType === 'DAILY' || t.repeatType === 'WEEKLY') return true;
    return false;
  });

  // Filter Habits:
  // 1. DAILY habits for TODAY: strictly DAILY frequency only, never weekly habits!
  const todayHabits = habits.filter(h => {
    if (h.isClosed) return false;
    // Exclude weekly habits so they appear only in the week view
    if (h.frequency === 'WEEKLY') return false;
    // Must be scheduled for today or completed today
    if (h.completionHistory[todayStr]) return true;
    if (Array.isArray(h.targetDaysOfWeek) && h.targetDaysOfWeek.length > 0) {
      return h.targetDaysOfWeek.includes(currentDayOfWeek);
    }
    return true;
  });

  // 2. WEEKLY habits (frequency === 'WEEKLY')
  const weeklyHabits = habits.filter(h => {
    if (h.isClosed) return false;
    return h.frequency === 'WEEKLY';
  });

  const getCategory = (catId: string) => categories.find(c => c.id === catId);

  const handleDayToggle = (habitId: string, dateStr: string) => {
    if (onToggleHabitDate) {
      onToggleHabitDate(habitId, dateStr);
    } else if (dateStr === todayStr) {
      onToggleHabitToday(habitId);
    }
  };

  // Helper: notify or confirm before starting tasks/habits on official holidays
  const startTimerWithHolidayNotification = (
    title: string,
    action: () => void
  ) => {
    if (holidayInfo.isHoliday) {
      setHolidayPrompt({
        isOpen: true,
        title,
        holidayTitle: holidayInfo.title || 'تعطیل رسمی',
        onConfirm: () => {
          setHolidayPrompt(null);
          action();
        },
      });
    } else {
      action();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Modern Uncluttered Garden Visual */}
      <GardenVisual
        plantState={plantState}
        habits={habits}
        goals={goals}
        tasks={tasks}
        categories={categories}
        onWaterHabit={onToggleHabitToday}
      />

      {/* Daily Motivation Quote */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong>«درخت تنومند، روزی دانه‌ای کوچک بوده است.»</strong> هر تسک و عادت امروز، قدمی محکم برای رشد و شکوفایی اهداف بزرگ شماست.
        </div>
      </div>

      {/* Official Iranian Holiday Alert Banner */}
      {holidayInfo.isHoliday && (
        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 shadow-2xs animate-scale-up space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-black text-rose-900">
                امروز در تقویم رسمی ایران تعطیل است:
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200/80 text-rose-950 border border-rose-300">
              {holidayInfo.title}
            </span>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            💡 <strong>توجه به روز تعطیل:</strong> امروز فرصت مناسبی برای استراحت، تجدید انرژی، یا پیگیری بدون دغدغه کارهای آرامش‌بخش است. پیش از شروع ساعت شنی تسک‌ها یا پروژه‌های جدی کاری، تعطیلی رسمی در نظر گرفته می‌شود.
          </p>
        </div>
      )}

      {/* View Switcher: روز (امروز) vs هفته (برنامه و عادات هفتگی) */}
      <div className="flex bg-white p-1 rounded-2xl border border-emerald-100/90 shadow-2xs text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setActiveViewMode('DAY')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeViewMode === 'DAY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>کارهای امروز (روز)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeViewMode === 'DAY' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {toPersianDigits(todayTasks.length + todayHabits.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewMode('WEEK')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeViewMode === 'WEEK'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>برنامه و عادات این هفته (هفته)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeViewMode === 'WEEK' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {toPersianDigits(weeklyHabits.length + weekTasks.length)}
          </span>
        </button>
      </div>

      {activeViewMode === 'DAY' ? (
        <>
          {/* Today's Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>تسک‌های امروز ({toPersianDigits(completedTodayTasks.length)} از {toPersianDigits(todayTasks.length)})</span>
              </h3>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن تسک</span>
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                برای امروز هیچ تسکی برنامه‌ریزی نشده است. می‌توانید یک تسک جدید اضافه کنید.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Active Pending Tasks */}
                {activeTodayTasks.map((t) => {
                  const cat = getCategory(t.categoryId);
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl border border-emerald-100/90 shadow-2xs hover:border-emerald-300 p-3.5 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          title="ثبت انجام تسک"
                          className="cursor-pointer text-gray-300 hover:text-emerald-600 transition-colors shrink-0"
                        >
                          <Circle className="w-5 h-5 hover:text-emerald-500" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                            {t.isImportant && (
                              <span className="shrink-0 p-0.5 rounded-xs bg-amber-100 text-amber-600" title="تسک مهم">
                                <Star className="w-3 h-3 fill-amber-500" />
                              </span>
                            )}
                            <span>{t.title}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                            <EntityBadge type="TASK" size="xs" />
                            {t.isImportant && (
                              <span className="px-1.5 py-0.2 rounded-md font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200/80">
                                مهم
                              </span>
                            )}
                            {t.reminderEnabled && (
                              <span className="px-1.5 py-0.2 rounded-md font-medium text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                                <Bell className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{toPersianDigits(t.reminderTime || t.time || '')}</span>
                              </span>
                            )}
                            {cat && (
                              <span
                                className="px-1.5 py-0.2 rounded-md font-medium text-[10px]"
                                style={{ backgroundColor: `${cat.colorHex}15`, color: cat.colorHex }}
                              >
                                {cat.title}
                              </span>
                            )}
                            {t.time && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60" title="زمان انجام">
                                <Clock className="w-2.5 h-2.5 text-emerald-600" />
                                <span>انجام: {toPersianDigits(t.time)}</span>
                              </span>
                            )}
                            {t.dueDate ? (
                              <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md" title="مهلت اتمام">
                                <Calendar className="w-2.5 h-2.5 text-gray-500" />
                                <span>مهلت: {toPersianDigits(t.dueDate)}{t.deadlineTime ? ` (${toPersianDigits(t.deadlineTime)})` : ''}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 border border-dashed border-gray-200 px-1.5 py-0.5 rounded-md" title="بدون موعد مشخص - مهلت پیش‌فرض: پایان سال">
                                <span>مهلت: پایان سال {toPersianDigits(today.year)}</span>
                              </span>
                            )}
                            {t.notes && (
                              <span className="text-gray-400 truncate max-w-[150px]">{t.notes}</span>
                            )}

                            {/* Hourglass Focus Progress Pill */}
                            {(t.focusProgressPercent !== undefined || (t.focusSessions && t.focusSessions.length > 0)) && (
                              <button
                                type="button"
                                onClick={() => setFocusHistoryEntity({
                                  isOpen: true,
                                  title: t.title,
                                  entityType: 'TASK',
                                  sessions: t.focusSessions || [],
                                  timerTargetMinutes: Math.floor(t.timerSecondsTarget / 60) || 25,
                                  currentElapsedSeconds: t.timerSecondsElapsed || 0,
                                  currentProgressPercent: t.focusProgressPercent || 0,
                                  taskId: t.id,
                                })}
                                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                                title="مشاهده تاریخچه ساعت شنی و پیشرفت"
                              >
                                <Hourglass className="w-2.5 h-2.5 text-amber-600" />
                                <span>پیشرفت تمرکز: {toPersianDigits(t.focusProgressPercent ?? 0)}٪</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* History button */}
                        <button
                          type="button"
                          onClick={() => setFocusHistoryEntity({
                            isOpen: true,
                            title: t.title,
                            entityType: 'TASK',
                            sessions: t.focusSessions || [],
                            timerTargetMinutes: Math.floor(t.timerSecondsTarget / 60) || 25,
                            currentElapsedSeconds: t.timerSecondsElapsed || 0,
                            currentProgressPercent: t.focusProgressPercent || 0,
                            taskId: t.id,
                          })}
                          title="مشاهده تاریخچه جلسات تمرکز ساعت شنی"
                          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {onDuplicateTask && (
                          <button
                            type="button"
                            onClick={() => onDuplicateTask(t)}
                            title="کپی گرفتن و ویرایش تسک (داپلیکیت)"
                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onEditTask && (
                          <button
                            type="button"
                            onClick={() => onEditTask(t)}
                            title="ویرایش تسک"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => startTimerWithHolidayNotification(t.title, () => {
                            onOpenTimer(
                              t.title,
                              Math.floor(t.timerSecondsTarget / 60) || 25,
                              (elapsed, isDone) => {
                                if (isDone) onToggleTask(t.id);
                              },
                              {
                                entityType: 'TASK',
                                taskId: t.id,
                                initialElapsedSeconds: t.timerSecondsElapsed || 0,
                                currentProgressPercent: t.focusProgressPercent || 0,
                              }
                            );
                          })}
                          title="شروع ساعت شنی تمرکز روی این تسک"
                          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Hourglass className="w-3.5 h-3.5 text-emerald-700" />
                          {t.focusProgressPercent && t.focusProgressPercent > 0 && (
                            <span className="text-[10px] font-bold text-emerald-800">{toPersianDigits(t.focusProgressPercent)}٪</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Completed Tasks Group */}
                {completedTodayTasks.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 py-1 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تسک‌های انجام‌شده ({toPersianDigits(completedTodayTasks.length)})</span>
                      {showCompletedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showCompletedTasks && (
                      <div className="space-y-2 mt-1.5">
                        {completedTodayTasks.map((t) => {
                          const cat = getCategory(t.categoryId);
                          return (
                            <div
                              key={t.id}
                              className="bg-gray-50/70 rounded-xl border border-gray-200/80 p-3 flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(t.id)}
                                  title="بازگردانی تسک"
                                  className="cursor-pointer text-emerald-600 hover:text-emerald-700 shrink-0"
                                >
                                  <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                                </button>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-500 line-through truncate">
                                    {t.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                    {cat && <span>{cat.title}</span>}
                                    <span>•</span>
                                    <span className="text-emerald-700 font-medium">تکمیل شده</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {onDuplicateTask && (
                                  <button
                                    type="button"
                                    onClick={() => onDuplicateTask(t)}
                                    title="کپی گرفتن و ویرایش تسک (داپلیکیت)"
                                    className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(t.id)}
                                  className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded bg-white border border-gray-200 cursor-pointer"
                                >
                                  لغو تیک
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Today's Daily Habits Section (Strictly Daily habits) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>عادت‌های روزانه امروز ({toPersianDigits(todayHabits.filter(h => h.completionHistory[todayStr]).length)} از {toPersianDigits(todayHabits.length)})</span>
              </h3>
              <button
                type="button"
                onClick={onOpenNewHabit}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>عادت جدید</span>
              </button>
            </div>

            {todayHabits.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                برای {weekdayName} هیچ عادت اختصاصی روزانه‌ای تعریف نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayHabits.map((h) => {
                  const isDoneToday = !!h.completionHistory[todayStr];
                  return (
                    <div
                      key={h.id}
                      className={`bg-white rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                        isDoneToday
                          ? 'border-emerald-300 bg-emerald-50/40 opacity-90'
                          : 'border-gray-200 shadow-2xs hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlantIcon type={h.plantType} size="sm" />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isDoneToday ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {h.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            <EntityBadge type="HABIT" size="xs" />
                            <span className="text-emerald-700 font-medium">{h.plantType}</span>
                            {h.timerMinutes > 0 && (
                              <span className="flex items-center gap-0.5 text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{toPersianDigits(h.timerMinutes)} دقیقه</span>
                              </span>
                            )}
                            {/* Today Habit Focus Progress */}
                            {h.dailyProgressHistory?.[todayStr] !== undefined && (
                              <button
                                type="button"
                                onClick={() => setFocusHistoryEntity({
                                  isOpen: true,
                                  title: h.title,
                                  entityType: 'HABIT',
                                  sessions: h.focusSessions || [],
                                  timerTargetMinutes: h.timerMinutes || 25,
                                  currentElapsedSeconds: h.dailyElapsedSeconds?.[todayStr] || 0,
                                  currentProgressPercent: h.dailyProgressHistory?.[todayStr] || 0,
                                  habitId: h.id,
                                })}
                                className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                              >
                                <Hourglass className="w-2.5 h-2.5 text-amber-600" />
                                <span>{toPersianDigits(h.dailyProgressHistory[todayStr])}٪</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Focus History */}
                        <button
                          type="button"
                          onClick={() => setFocusHistoryEntity({
                            isOpen: true,
                            title: h.title,
                            entityType: 'HABIT',
                            sessions: h.focusSessions || [],
                            timerTargetMinutes: h.timerMinutes || 25,
                            currentElapsedSeconds: h.dailyElapsedSeconds?.[todayStr] || 0,
                            currentProgressPercent: h.dailyProgressHistory?.[todayStr] || 0,
                            habitId: h.id,
                          })}
                          title="مشاهده تاریخچه ساعت شنی تمرکز"
                          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {h.timerMinutes > 0 && !isDoneToday && (
                          <button
                            type="button"
                            onClick={() => startTimerWithHolidayNotification(h.title, () => {
                              onOpenTimer(
                                h.title,
                                h.timerMinutes,
                                (elapsed, isDone) => {
                                  if (isDone) onToggleHabitToday(h.id);
                                },
                                {
                                  entityType: 'HABIT',
                                  habitId: h.id,
                                  initialElapsedSeconds: h.dailyElapsedSeconds?.[todayStr] || 0,
                                  currentProgressPercent: h.dailyProgressHistory?.[todayStr] || 0,
                                }
                              );
                            })}
                            title="شروع ساعت شنی تمرکز روی عادت"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Hourglass className="w-3.5 h-3.5 text-emerald-700" />
                            {h.dailyProgressHistory?.[todayStr] ? (
                              <span className="text-[10px] font-bold">{toPersianDigits(h.dailyProgressHistory[todayStr])}٪</span>
                            ) : null}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleHabitToday(h.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isDoneToday
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {isDoneToday ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>انجام شد</span>
                            </>
                          ) : (
                            <span>ثبت انجام</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Week View: Weekly Habits & Week's Tasks */
        <div className="space-y-6">
          {/* Weekly Habits Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  <span>عادت‌های هفتگی ({toPersianDigits(weeklyHabits.length)} عادت)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">عادت‌هایی با هدف تعداد روز مشخص در طول هفته</p>
              </div>
              <button
                type="button"
                onClick={onOpenNewHabit}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>عادت هفتگی جدید</span>
              </button>
            </div>

            {weeklyHabits.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                در حال حاضر هیچ عادت هفتگی ثبت نشده است. می‌توانید با کلیک روی «عادت هفتگی جدید»، عاداتی نظیر ورزش هفتگی یا شنا اضافه کنید.
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyHabits.map((h) => {
                  const targetDays = h.targetDaysPerWeek || 3;
                  // Count completed days in the current week
                  const doneDaysThisWeek = currentWeekDateStrings.filter(dStr => !!h.completionHistory[dStr]).length;
                  const isGoalMet = doneDaysThisWeek >= targetDays;

                  return (
                    <div
                      key={h.id}
                      className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition-all ${
                        isGoalMet ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <PlantIcon type={h.plantType} size="md" />
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{h.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                              <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                هفتگی
                              </span>
                              <span>هدف: {toPersianDigits(targetDays)} روز در هفته</span>
                              <span>•</span>
                              <span className={`font-bold ${isGoalMet ? 'text-emerald-700' : 'text-gray-700'}`}>
                                انجام شده: {toPersianDigits(doneDaysThisWeek)} از {toPersianDigits(targetDays)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isGoalMet && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>هدف هفتگی محقق شد 🎉</span>
                          </span>
                        )}
                      </div>

                      {/* 7 Days of the Week Selector */}
                      <div className="pt-1">
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                          {currentWeekDays.map((day) => {
                            const isDone = !!h.completionHistory[day.dateStr];
                            const dayHol = isDateHoliday(day.date);
                            const isHol = dayHol.isHoliday;
                            return (
                              <button
                                key={day.dateStr}
                                type="button"
                                onClick={() => handleDayToggle(h.id, day.dateStr)}
                                title={isHol ? `${dayHol.title} (تعطیل رسمی)` : day.dateStr}
                                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                                  isDone
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                                    : day.isToday
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100'
                                    : isHol
                                    ? 'bg-rose-50/80 border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className={`text-[10px] ${isHol && !isDone ? 'text-rose-600 font-bold' : 'opacity-80'}`}>
                                  {day.shortName}
                                </span>
                                <span className={`text-xs ${isHol && !isDone ? 'text-rose-700 font-extrabold' : ''}`}>
                                  {toPersianDigits(day.date.day)}
                                </span>
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Droplets className={`w-3 h-3 ${day.isToday ? 'text-sky-600' : isHol ? 'text-rose-400' : 'text-gray-300'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* This Week's Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <span>تسک‌های این هفته ({toPersianDigits(weekTasks.filter(t => t.isCompleted).length)} از {toPersianDigits(weekTasks.length)})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">وظایفی که موعد انجام آن‌ها در روزهای شنبه تا جمعه این هفته است</p>
              </div>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن تسک</span>
              </button>
            </div>

            {weekTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                در این هفته تسک موعدداری ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {weekTasks.map((t) => {
                  const cat = getCategory(t.categoryId);
                  return (
                    <div
                      key={t.id}
                      className={`bg-white rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                        t.isCompleted
                          ? 'border-gray-200 bg-gray-50/60 opacity-80'
                          : 'border-emerald-100 shadow-2xs hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          className="cursor-pointer text-gray-300 hover:text-emerald-600 transition-colors shrink-0"
                        >
                          {t.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                          ) : (
                            <Circle className="w-5 h-5 hover:text-emerald-500" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${t.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {t.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                            <EntityBadge type="TASK" size="xs" />
                            {cat && (
                              <span
                                className="px-1.5 py-0.2 rounded-md font-medium text-[10px]"
                                style={{ backgroundColor: `${cat.colorHex}15`, color: cat.colorHex }}
                              >
                                {cat.title}
                              </span>
                            )}
                            {t.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                                <Calendar className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{toPersianDigits(t.dueDate)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            t.isCompleted
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {t.isCompleted ? 'لغو تیک' : 'ثبت انجام'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Focus History Modal for Tasks and Habits */}
      {focusHistoryEntity && (
        <FocusHistoryModal
          isOpen={focusHistoryEntity.isOpen}
          title={focusHistoryEntity.title}
          entityType={focusHistoryEntity.entityType}
          sessions={focusHistoryEntity.sessions}
          timerTargetMinutes={focusHistoryEntity.timerTargetMinutes}
          currentElapsedSeconds={focusHistoryEntity.currentElapsedSeconds}
          currentProgressPercent={focusHistoryEntity.currentProgressPercent}
          onClose={() => setFocusHistoryEntity(null)}
          onOpenTimerNow={() => {
            const ent = focusHistoryEntity;
            setFocusHistoryEntity(null);
            onOpenTimer(
              ent.title,
              ent.timerTargetMinutes,
              (elapsed, isDone) => {
                if (isDone) {
                  if (ent.entityType === 'TASK' && ent.taskId) onToggleTask(ent.taskId);
                  if (ent.entityType === 'HABIT' && ent.habitId) onToggleHabitToday(ent.habitId);
                }
              },
              {
                entityType: ent.entityType,
                taskId: ent.taskId,
                habitId: ent.habitId,
                initialElapsedSeconds: ent.currentElapsedSeconds,
                currentProgressPercent: ent.currentProgressPercent,
              }
            );
          }}
        />
      )}

      {/* Holiday Notification Dialog Before Task/Habit Start */}
      {holidayPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-rose-200 space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-gray-900">
                  اطلاع‌رسانی تعطیلی رسمی تقویم
                </h3>
                <p className="text-xs text-rose-700 font-bold">
                  امروز به دلیل «{holidayPrompt.holidayTitle}» تعطیل رسمی کشور است.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              قصد دارید کار روی «<strong className="text-gray-900">{holidayPrompt.title}</strong>» را آغاز کنید. آیا تمایل دارید تایمر تمرکز این فعالیت در روز تعطیل شروع شود؟
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHolidayPrompt(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف و استراحت
              </button>
              <button
                type="button"
                onClick={() => holidayPrompt.onConfirm()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، شروع تمرکز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
