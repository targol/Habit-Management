import React, { useState } from 'react';
import { Habit, Category, Goal } from '../types';
import { 
  getTodayJalali, 
  jalaliToFormattedString, 
  toPersianDigits, 
  WEEKDAYS, 
  WEEKDAYS_SHORT, 
  getDayOfWeek 
} from '../calendar/jalali';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Target, 
  Calendar,
  Check,
  CalendarCheck2,
  Filter
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';
import { EntityBadge, EntityIcon } from './EntityIcon';

interface Props {
  habits: Habit[];
  categories: Category[];
  goals: Goal[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onNewHabit: () => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
}

export const HabitsScreen: React.FC<Props> = ({
  habits,
  categories,
  goals,
  onToggleHabitDate,
  onDeleteHabit,
  onEditHabit,
  onNewHabit,
  onOpenTimer,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const todayDayOfWeek = getDayOfWeek(today); // 0=Sat, 1=Sun, ..., 6=Fri

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSchedule, setFilterSchedule] = useState<'ALL' | 'TODAY_DUE' | 'COMPLETED_TODAY'>('ALL');

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  const getGoal = (goalId?: string | null) => goals.find(g => g.id === goalId);

  // Filter habits based on category and schedule
  const filteredHabits = habits.filter(h => {
    if (filterCategory !== 'ALL' && h.categoryId !== filterCategory) return false;
    
    const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    const isDueToday = targetDays.includes(todayDayOfWeek);
    const isDoneToday = !!h.completionHistory?.[todayStr];

    if (filterSchedule === 'TODAY_DUE' && !isDueToday) return false;
    if (filterSchedule === 'COMPLETED_TODAY' && !isDoneToday) return false;

    return true;
  });

  // Calculate today stats
  const totalDueToday = habits.filter(h => {
    const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    return targetDays.includes(todayDayOfWeek);
  }).length;

  const completedTodayCount = habits.filter(h => {
    const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    return targetDays.includes(todayDayOfWeek) && !!h.completionHistory?.[todayStr];
  }).length;

  // Helper to find the next scheduled day name
  const getNextScheduledDayName = (targetDays: number[]): string => {
    if (!targetDays || targetDays.length === 0) return 'تنظیم نشده';
    if (targetDays.length === 7) return 'فردا';
    
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIdx = (todayDayOfWeek + offset) % 7;
      if (targetDays.includes(nextDayIdx)) {
        if (offset === 1) return 'فردا (' + WEEKDAYS[nextDayIdx] + ')';
        return WEEKDAYS[nextDayIdx];
      }
    }
    return WEEKDAYS[targetDays[0]];
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Header & New Habit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>عادت‌ها و تکرار دوره‌ای</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {toPersianDigits(completedTodayCount)} از {toPersianDigits(totalDueToday)} انجام شده برای امروز
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            مشاهده تناوب تکرار (روزانه یا روزهای مشخص هفته) و وضعیت انجام در روز موعد
          </p>
        </div>

        <button
          type="button"
          onClick={onNewHabit}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setFilterSchedule('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterSchedule === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            همه عادت‌ها ({toPersianDigits(habits.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterSchedule('TODAY_DUE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterSchedule === 'TODAY_DUE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>موعد امروز ({toPersianDigits(totalDueToday)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSchedule('COMPLETED_TODAY')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterSchedule === 'COMPLETED_TODAY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>انجام شده امروز ({toPersianDigits(completedTodayCount)})</span>
          </button>
        </div>

        {/* Category filter dropdown */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-gray-700 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="ALL">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Habit Cards */}
      {filteredHabits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-500 space-y-2">
          <p>هیچ عادتی با این فیلتر یافت نشد.</p>
          <button
            type="button"
            onClick={onNewHabit}
            className="text-emerald-700 font-bold hover:underline"
          >
            تعریف عادت جدید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHabits.map((h) => {
            const cat = getCategory(h.categoryId);
            const goal = getGoal(h.goalId);
            const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
            const isEveryday = targetDays.length === 7;
            const isDueToday = targetDays.includes(todayDayOfWeek);
            const isDoneToday = !!h.completionHistory?.[todayStr];
            const nextDayName = getNextScheduledDayName(targetDays);

            return (
              <div
                key={h.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                  isDoneToday
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isDueToday
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Top: Icon, Title, Plant, Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0">
                        <PlantIcon type={h.plantType} size="md" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate leading-snug">
                          {h.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <EntityBadge type="HABIT" size="xs" />

                          {cat && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: `${cat.colorHex}15`,
                                color: cat.colorHex,
                                borderColor: `${cat.colorHex}30`,
                              }}
                            >
                              {cat.title}
                            </span>
                          )}

                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            گیاه: {h.plantType}
                          </span>

                          {goal && (
                            <EntityBadge
                              type={goal.period === 'ANNUAL' ? 'ANNUAL_GOAL' : 'INTERMEDIATE_GOAL'}
                              customLabel={goal.title}
                              size="xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditHabit(h)}
                        title="ویرایش عادت"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(h.id)}
                        title="حذف عادت"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {h.notes && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {h.notes}
                    </p>
                  )}
                </div>

                {/* Middle: Frequency & Scheduled Days Indicator */}
                <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      <span>تناوب تکرار:</span>
                      <strong className="text-gray-900 font-bold">
                        {isEveryday ? 'روزانه (هر روز)' : `هفتگی (${toPersianDigits(targetDays.length)} روز در هفته)`}
                      </strong>
                    </span>

                    {/* Today Status Pill */}
                    {isDueToday ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span>موعد امروز</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200/70 text-gray-600">
                        استراحت (موعد بعد: {nextDayName})
                      </span>
                    )}
                  </div>

                  {/* Visual 7 Weekday Pills */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAYS_SHORT.map((dayShort, dIdx) => {
                      const isScheduled = targetDays.includes(dIdx);
                      const isToday = dIdx === todayDayOfWeek;

                      return (
                        <div
                          key={dIdx}
                          className={`py-1 rounded-lg text-[11px] font-bold transition-all relative ${
                            isScheduled
                              ? isToday
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs'
                                : 'bg-emerald-100 text-emerald-800'
                              : isToday
                              ? 'bg-gray-200 text-gray-600 ring-1 ring-gray-400'
                              : 'bg-gray-100 text-gray-400 opacity-60'
                          }`}
                          title={`${WEEKDAYS[dIdx]}${isToday ? ' (امروز)' : ''}${isScheduled ? ' - روز هدف' : ' - بدون برنامه'}`}
                        >
                          {dayShort}
                          {isToday && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-1 ring-white" title="امروز"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom: Action buttons (Mark Done + Focus Timer) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onToggleHabitDate(h.id, todayStr)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDoneToday
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                        : isDueToday
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {isDoneToday ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>انجام شد برای امروز</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-gray-400" />
                        <span>ثبت انجام امروز</span>
                      </>
                    )}
                  </button>

                  {h.timerMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenTimer(h.title, h.timerMinutes, () => onToggleHabitDate(h.id, todayStr))}
                      title={`شروع جلسه تمرکز (${toPersianDigits(h.timerMinutes)} دقیقه)`}
                      className="py-2 px-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-700 text-emerald-700" />
                      <span className="hidden sm:inline">{toPersianDigits(h.timerMinutes)} دقیقه</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
