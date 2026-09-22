import React, { useState } from 'react';
import { Habit, Category, Goal } from '../types';
import { 
  getTodayJalali, 
  jalaliToFormattedString, 
  toPersianDigits, 
  WEEKDAYS, 
  WEEKDAYS_SHORT, 
  getDayOfWeek,
  addDaysJalali,
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
  Filter,
  CalendarDays,
  History,
  X,
  Archive,
  Sparkles,
  Copy
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';
import { EntityBadge, EntityIcon } from './EntityIcon';
import { HabitContributionGrid } from './HabitContributionGrid';

const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
const SEASON_ICONS = ['🌸', '☀️', '🍂', '❄️'];

interface Props {
  habits: Habit[];
  categories: Category[];
  goals: Goal[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDuplicateHabit?: (habit: Habit) => void;
  onNewHabit: () => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
  onToggleCloseHabit?: (habitId: string) => void;
}

export const HabitsScreen: React.FC<Props> = ({
  habits,
  categories,
  goals,
  onToggleHabitDate,
  onDeleteHabit,
  onEditHabit,
  onDuplicateHabit,
  onNewHabit,
  onOpenTimer,
  onToggleCloseHabit,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const todayDayOfWeek = getDayOfWeek(today); // 0=Sat, 1=Sun, ..., 6=Fri

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSchedule, setFilterSchedule] = useState<'ACTIVE' | 'TODAY_DUE' | 'COMPLETED_TODAY' | 'CLOSED' | 'ALL'>('ACTIVE');
  const [expandedGrid, setExpandedGrid] = useState<Record<string, boolean>>({});
  const [customDateModalHabit, setCustomDateModalHabit] = useState<Habit | null>(null);
  const [customDateInput, setCustomDateInput] = useState<string>(todayStr);

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  const getGoal = (goalId?: string | null) => goals.find(g => g.id === goalId);

  const activeHabits = habits.filter(h => !h.isClosed);
  const closedHabits = habits.filter(h => !!h.isClosed);

  // Filter habits based on category and schedule
  const filteredHabits = habits.filter(h => {
    if (filterCategory !== 'ALL' && h.categoryId !== filterCategory) return false;
    
    const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    const isDueToday = targetDays.includes(todayDayOfWeek);
    const isDoneToday = !!h.completionHistory?.[todayStr];

    if (filterSchedule === 'ACTIVE' && h.isClosed) return false;
    if (filterSchedule === 'TODAY_DUE' && (h.isClosed || !isDueToday)) return false;
    if (filterSchedule === 'COMPLETED_TODAY' && (h.isClosed || !isDoneToday)) return false;
    if (filterSchedule === 'CLOSED' && !h.isClosed) return false;

    return true;
  });

  // Calculate today stats based on active habits
  const totalDueToday = activeHabits.filter(h => {
    const targetDays = h.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    return targetDays.includes(todayDayOfWeek);
  }).length;

  const completedTodayCount = activeHabits.filter(h => {
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
      {/* Sticky Header & Filter Tabs */}
      <div className="sticky -top-5 z-20 pt-5 pb-2.5 bg-[#F8F9F5]/95 backdrop-blur-md space-y-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Header & New Habit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>عادت‌ها و تکرار دوره‌ای</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {toPersianDigits(completedTodayCount)} از {toPersianDigits(totalDueToday)} انجام شده برای امروز
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              مشاهده تناوب تکرار (روزانه یا روزهای مشخص هفته)، اتصال به اهداف سالانه و وضعیت پیگیری
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterSchedule('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterSchedule === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              عادت‌های جاری ({toPersianDigits(activeHabits.length)})
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
            <button
              type="button"
              onClick={() => setFilterSchedule('CLOSED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filterSchedule === 'CLOSED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>عادات بسته‌شده ({toPersianDigits(closedHabits.length)})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterSchedule('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterSchedule === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              همه ({toPersianDigits(habits.length)})
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

                          {h.isClosed && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Archive className="w-3 h-3 text-amber-700" />
                              <span>بسته‌شده {h.closedAt ? `(${toPersianDigits(h.closedAt)})` : ''}</span>
                            </span>
                          )}

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
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
                              {goal.period === 'ANNUAL' ? (
                                <>
                                  <span>🎯 هدف سالانه: {goal.title}</span>
                                  <span className="text-[9px] text-emerald-600 font-normal hidden sm:inline">(جاری در همه فصول)</span>
                                </>
                              ) : (
                                <>
                                  <span>{SEASON_ICONS[goal.seasonIndex ?? 0]} هدف {SEASONS[goal.seasonIndex ?? 0]}: {goal.title}</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onToggleCloseHabit && (
                        <button
                          type="button"
                          onClick={() => onToggleCloseHabit(h.id)}
                          title={h.isClosed ? 'بازگشایی مجدد عادت' : 'بستن عادت (بایگانی با حفظ تاریخچه)'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            h.isClosed
                              ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                              : 'text-gray-400 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDuplicateHabit && (
                        <button
                          type="button"
                          onClick={() => onDuplicateHabit(h)}
                          title="کپی از این عادت"
                          className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      <span>تناوب تکرار:</span>
                      <strong className="text-gray-900 font-bold">
                        {isEveryday ? 'روزانه (هر روز)' : `هفتگی (${toPersianDigits(targetDays.length)} روز در هفته)`}
                      </strong>
                    </span>

                    {/* Today Status Pill - Without any 'Rest' label */}
                    {isDueToday ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span>برنامه امروز</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        موعد بعدی: {nextDayName}
                      </span>
                    )}
                  </div>

                  {/* Interactive Weekday Buttons for Current Week */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span>روزهای این هفته (برای ثبت یا لغو کلیک کنید):</span>
                      <button
                        type="button"
                        onClick={() => setExpandedGrid(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <History className="w-3 h-3" />
                        <span>{expandedGrid[h.id] ? 'بستن تاریخچه' : 'شبکه ۲۸ روز'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {[0, 1, 2, 3, 4, 5, 6].map((dIdx) => {
                        const offset = dIdx - todayDayOfWeek;
                        const d = addDaysJalali(today, offset);
                        const dateStr = jalaliToFormattedString(d);
                        const isDone = Boolean(h.completionHistory?.[dateStr]);
                        const isScheduled = targetDays.includes(dIdx);
                        const isToday = dIdx === todayDayOfWeek;

                        return (
                          <button
                            key={dIdx}
                            type="button"
                            onClick={() => onToggleHabitDate(h.id, dateStr)}
                            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 cursor-pointer border select-none ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs hover:bg-emerald-700'
                                : isToday
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                : isScheduled
                                ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                : 'bg-gray-100/70 text-gray-400 border-gray-200/50 hover:bg-gray-100'
                            }`}
                            title={`${WEEKDAYS[dIdx]} (${dateStr}) - ${isDone ? 'انجام شده (کلیک برای لغو)' : 'برای ثبت انجام کلیک کنید'}`}
                          >
                            <span className="text-[10px] opacity-75">{WEEKDAYS_SHORT[dIdx]}</span>
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="text-[10px] font-medium">{toPersianDigits(d.day)}</span>
                            )}
                            {isToday && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-1 ring-white" title="امروز"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expandable 28-day contribution grid */}
                  {expandedGrid[h.id] && (
                    <HabitContributionGrid
                      habit={h}
                      onToggleDate={(dateStr) => onToggleHabitDate(h.id, dateStr)}
                    />
                  )}
                </div>

                {/* Bottom: Action buttons (Mark Done + Focus Timer) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
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
                          <span>امروز انجام شد</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-gray-400" />
                          <span>ثبت انجام امروز</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomDateModalHabit(h);
                        setCustomDateInput(todayStr);
                      }}
                      title="ثبت برای روزهای دیگر یا انتخاب تاریخ دلخواه"
                      className="py-2 px-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                      <span>روز دیگر</span>
                    </button>
                  </div>

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
      {/* Custom Date Logger Modal */}
      {customDateModalHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">ثبت وضعیت برای روزهای دیگر</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                    «{customDateModalHabit.title}»
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomDateModalHabit(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-700 block">روزهای اخیر:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'دیروز', days: -1 },
                  { label: 'پریروز', days: -2 },
                  { label: '۳ روز پیش', days: -3 },
                ].map((preset) => {
                  const pDate = addDaysJalali(today, preset.days);
                  const pDateStr = jalaliToFormattedString(pDate);
                  const isDone = Boolean(customDateModalHabit.completionHistory?.[pDateStr]);

                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => {
                        onToggleHabitDate(customDateModalHabit.id, pDateStr);
                        setCustomDateModalHabit(null);
                      }}
                      className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-80">{toPersianDigits(pDate.day)} {WEEKDAYS_SHORT[getDayOfWeek(pDate)]}</span>
                      <span className="text-[9px] font-bold">{isDone ? '✓ انجام شد' : 'ثبت'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-gray-700 block">
                یا تاریخ دلخواه (مثلاً ۱۴۰۳/۰۷/۱۵):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="YYYY/MM/DD"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono text-center focus:border-emerald-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDateInput.trim()) {
                      onToggleHabitDate(customDateModalHabit.id, customDateInput.trim());
                      setCustomDateModalHabit(null);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  تغییر وضعیت
                </button>
              </div>
              {customDateModalHabit.completionHistory?.[customDateInput.trim()] && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ در حال حاضر برای این تاریخ انجام‌شده ثبت است (کلیک کنید تا لغو شود).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
