import React, { useState } from 'react';
import { AppTask, Habit, Category, PlantState, Goal } from '../types';
import { GardenVisual } from './GardenVisual';
import { 
  getTodayJalali, 
  getDayOfWeek,
  toPersianDigits, 
  PERSIAN_MONTHS, 
  WEEKDAYS, 
  isDateHoliday, 
  jalaliToFormattedString 
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
  ChevronUp
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';
import { EntityBadge, EntityIcon } from './EntityIcon';

interface Props {
  tasks: AppTask[];
  habits: Habit[];
  goals: Goal[];
  categories: Category[];
  plantState: PlantState;
  onToggleTask: (taskId: string) => void;
  onToggleHabitToday: (habitId: string) => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
}

export const TodayScreen: React.FC<Props> = ({
  tasks,
  habits,
  goals,
  categories,
  plantState,
  onToggleTask,
  onToggleHabitToday,
  onOpenTimer,
  onOpenNewTask,
  onOpenNewHabit,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentDayOfWeek = getDayOfWeek(today); // 0=شنبه .. 6=جمعه
  const weekdayName = WEEKDAYS[currentDayOfWeek];
  const holidayInfo = isDateHoliday(today);

  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  // Filter Tasks: ONLY items for today or items without a specific date
  const todayTasks = tasks.filter(t => {
    // 1. If it has a specific due date, it MUST match today
    if (t.dueDate) {
      return t.dueDate === todayStr;
    }
    // 2. Daily repeating task
    if (t.repeatType === 'DAILY') {
      return true;
    }
    // 3. Weekly repeating task: must include today's weekday
    if (t.repeatType === 'WEEKLY') {
      return Array.isArray(t.repeatDaysOfWeek) && t.repeatDaysOfWeek.includes(currentDayOfWeek);
    }
    // 4. Tasks without any specific due date or schedule: show in pending pool
    return true;
  });

  const activeTasks = todayTasks.filter(t => !t.isCompleted);
  const completedTasks = todayTasks.filter(t => t.isCompleted);

  // Filter Habits: ONLY habits scheduled for today's day of week (or daily without restriction)
  const todayHabits = habits.filter(h => {
    // Weekend exemption: Friday (6)
    if (h.exemptWeekends && currentDayOfWeek === 6) {
      return false;
    }
    // Official holiday exemption
    if (h.exemptHolidays && holidayInfo.isHoliday) {
      return false;
    }
    // Weekly or specific target days: must include today
    if (Array.isArray(h.targetDaysOfWeek) && h.targetDaysOfWeek.length > 0) {
      return h.targetDaysOfWeek.includes(currentDayOfWeek);
    }
    // Default: daily habit
    return true;
  });

  const getCategory = (catId: string) => categories.find(c => c.id === catId);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Date Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-100/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-bold shadow-xs">
            <span className="text-xs leading-none opacity-90">{weekdayName}</span>
            <span className="text-lg leading-tight mt-0.5">{toPersianDigits(today.day)}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{toPersianDigits(today.day)} {PERSIAN_MONTHS[today.month - 1]} {toPersianDigits(today.year)}</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {holidayInfo.isHoliday ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3 h-3" />
                  <span>تعطیل رسمی: {holidayInfo.title}</span>
                </span>
              ) : (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{weekdayName} پرانرژی و پربار</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Pomodoro Launcher */}
        <button
          type="button"
          onClick={() => onOpenTimer('جلسه تمرکز آزاد', 25, () => {})}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-700" />
          <span>تایمر تمرکز (۲۵ دقیقه)</span>
        </button>
      </div>

      {/* Modern Uncluttered Garden Visual */}
      <GardenVisual
        plantState={plantState}
        habits={todayHabits}
        goals={goals}
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

      {/* Today's Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>تسک‌های امروز ({toPersianDigits(completedTasks.length)} از {toPersianDigits(todayTasks.length)})</span>
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
            {activeTasks.map((t) => {
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
                      <p className="text-xs font-bold text-gray-900 truncate">
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
                        {t.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{toPersianDigits(t.time)}</span>
                          </span>
                        )}
                        {t.notes && (
                          <span className="text-gray-400 truncate max-w-[150px]">{t.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTimer(t.title, Math.floor(t.timerSecondsTarget / 60) || 25, () => onToggleTask(t.id))}
                    title="شروع تمرکز روی این تسک"
                    className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shrink-0 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Completed Tasks Group */}
            {completedTasks.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 py-1 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تسک‌های انجام‌شده ({toPersianDigits(completedTasks.length)})</span>
                  {showCompletedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showCompletedTasks && (
                  <div className="space-y-2 mt-1.5">
                    {completedTasks.map((t) => {
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

                          <button
                            type="button"
                            onClick={() => onToggleTask(t.id)}
                            className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded bg-white border border-gray-200 cursor-pointer"
                          >
                            لغو تیک
                          </button>
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

      {/* Today's Habits Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>عادت‌های روزانه ({toPersianDigits(todayHabits.filter(h => h.completionHistory[todayStr]).length)} از {toPersianDigits(todayHabits.length)})</span>
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
            برای {weekdayName} هیچ عادت اختصاصی تعریف نشده است.
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
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                        <EntityBadge type="HABIT" size="xs" />
                        <span className="text-emerald-700 font-medium">{h.plantType}</span>
                        {h.timerMinutes > 0 && (
                          <span className="flex items-center gap-0.5 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{toPersianDigits(h.timerMinutes)} دقیقه</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {h.timerMinutes > 0 && !isDoneToday && (
                      <button
                        type="button"
                        onClick={() => onOpenTimer(h.title, h.timerMinutes, () => onToggleHabitToday(h.id))}
                        title="شروع تمرکز روی عادت"
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
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
    </div>
  );
};
