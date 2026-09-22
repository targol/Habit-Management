import React, { useState } from 'react';
import { PlantState, Habit, Goal, AppTask, Category } from '../types';
import { PlantIcon } from './PlantIcon';
import { 
  toPersianDigits, 
  getTodayJalali, 
  jalaliToFormattedString,
  parseJalaliString,
  PERSIAN_MONTHS,
  getDayOfWeek,
  getCurrentWeekJalaliDays
} from '../calendar/jalali';
import { 
  Sparkles, 
  Droplets, 
  Sun, 
  Check, 
  Calendar, 
  Sprout, 
  Leaf, 
  Target, 
  CheckSquare, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Compass,
  Flower2
} from 'lucide-react';
import { 
  calculateSeasonGardenSummary, 
  calculateYearGardenSummary, 
  SEASON_META,
  getSeasonForMonth,
  SeasonGardenSummary,
  YearGardenSummary
} from '../utils/gardenCalculations';

export interface BloomedFlowerItem {
  id: string;
  title: string;
  plantType: string;
  kind: 'HABIT' | 'TASK';
  categoryTitle?: string;
  categoryColor?: string;
  completedDate?: string;
  time?: string | null;
}

interface Props {
  plantState?: PlantState;
  habits: Habit[];
  goals: Goal[];
  tasks?: AppTask[];
  categories?: Category[];
  onWaterHabit: (habitId: string) => void;
  initialScope?: 'DAY' | 'WEEK' | 'MONTH' | 'SEASON' | 'YEAR';
  selectedYear?: number;
  className?: string;
}

export const GardenVisual: React.FC<Props> = ({
  plantState,
  habits,
  goals,
  tasks = [],
  categories = [],
  onWaterHabit,
  initialScope = 'DAY',
  selectedYear,
  className = '',
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentDayOfWeek = getDayOfWeek(today); // 0=Saturday .. 6=Friday
  const currentSeasonIndex = getSeasonForMonth(today.month);

  const [timeScope, setTimeScope] = useState<'DAY' | 'WEEK' | 'MONTH' | 'SEASON' | 'YEAR'>(initialScope);
  const [activeSeasonIdx, setActiveSeasonIdx] = useState<number>(currentSeasonIndex);
  const [activeYear, setActiveYear] = useState<number>(selectedYear || today.year);

  // Available unique years in goals or current year
  const availableYears = React.useMemo(() => {
    const setYears = new Set((goals || []).map(g => g.year || today.year));
    setYears.add(today.year);
    return Array.from(setYears).sort((a, b) => a - b);
  }, [goals, today.year]);

  // Current week days
  const currentWeekDays = React.useMemo(() => getCurrentWeekJalaliDays(today), [today]);
  const currentWeekDateStrings = React.useMemo(() => currentWeekDays.map(d => d.dateStr), [currentWeekDays]);

  // Botanical individual flowers for completed items in the selected scope
  const bloomedFlowers = React.useMemo<BloomedFlowerItem[]>(() => {
    const list: BloomedFlowerItem[] = [];
    const getCat = (catId?: string) => categories.find(c => c.id === catId);

    if (timeScope === 'DAY') {
      // Completed habits today
      habits.forEach(h => {
        if (!h.isClosed && h.completionHistory && h.completionHistory[todayStr]) {
          list.push({
            id: `habit-${h.id}`,
            title: h.title,
            plantType: h.plantType || 'بونسای',
            kind: 'HABIT',
            categoryTitle: getCat(h.categoryId)?.title,
            categoryColor: getCat(h.categoryId)?.colorHex,
            completedDate: todayStr,
            time: h.time,
          });
        }
      });

      // Completed tasks today
      (tasks || []).forEach(t => {
        if (t.isCompleted && (t.completedAt === todayStr || (!t.completedAt && t.dueDate === todayStr))) {
          const cat = getCat(t.categoryId);
          list.push({
            id: `task-${t.id}`,
            title: t.title,
            plantType: cat?.plantType || 'برگ انجیری',
            kind: 'TASK',
            categoryTitle: cat?.title,
            categoryColor: cat?.colorHex,
            completedDate: t.completedAt || todayStr,
            time: t.time,
          });
        }
      });
    } else if (timeScope === 'WEEK') {
      // Completed habits this week
      habits.forEach(h => {
        if (!h.isClosed && h.completionHistory) {
          const completedDay = currentWeekDateStrings.find(d => h.completionHistory[d]);
          if (completedDay) {
            list.push({
              id: `habit-${h.id}`,
              title: h.title,
              plantType: h.plantType || 'بونسای',
              kind: 'HABIT',
              categoryTitle: getCat(h.categoryId)?.title,
              categoryColor: getCat(h.categoryId)?.colorHex,
              completedDate: completedDay,
              time: h.time,
            });
          }
        }
      });

      // Completed tasks this week
      (tasks || []).forEach(t => {
        if (t.isCompleted) {
          const doneDate = t.completedAt || t.dueDate;
          if (doneDate && currentWeekDateStrings.includes(doneDate)) {
            const cat = getCat(t.categoryId);
            list.push({
              id: `task-${t.id}`,
              title: t.title,
              plantType: cat?.plantType || 'برگ انجیری',
              kind: 'TASK',
              categoryTitle: cat?.title,
              categoryColor: cat?.colorHex,
              completedDate: doneDate,
              time: t.time,
            });
          }
        }
      });
    } else if (timeScope === 'MONTH') {
      // Completed habits this month
      habits.forEach(h => {
        if (!h.isClosed && h.completionHistory) {
          const isDoneInMonth = Object.entries(h.completionHistory).some(([dStr, done]) => {
            if (!done) return false;
            const p = parseJalaliString(dStr);
            return p && p.year === today.year && p.month === today.month;
          });
          if (isDoneInMonth) {
            list.push({
              id: `habit-${h.id}`,
              title: h.title,
              plantType: h.plantType || 'بونسای',
              kind: 'HABIT',
              categoryTitle: getCat(h.categoryId)?.title,
              categoryColor: getCat(h.categoryId)?.colorHex,
            });
          }
        }
      });

      // Completed tasks this month
      (tasks || []).forEach(t => {
        if (t.isCompleted) {
          const doneDate = t.completedAt || t.dueDate;
          if (doneDate) {
            const p = parseJalaliString(doneDate);
            if (p && p.year === today.year && p.month === today.month) {
              const cat = getCat(t.categoryId);
              list.push({
                id: `task-${t.id}`,
                title: t.title,
                plantType: cat?.plantType || 'برگ انجیری',
                kind: 'TASK',
                categoryTitle: cat?.title,
                categoryColor: cat?.colorHex,
                completedDate: doneDate,
                time: t.time,
              });
            }
          }
        }
      });
    }

    return list;
  }, [timeScope, habits, tasks, categories, todayStr, currentWeekDateStrings, today.year, today.month]);

  // Calculations for DAY / WEEK / MONTH
  let scopeCompleted = 0;
  let scopeTotal = 0;
  let scopeLabel = '';

  if (timeScope === 'DAY') {
    scopeLabel = 'پیشرفت کارهای امروز';
    // Only daily habits for today
    const dailyHabitsToday = habits.filter(h => !h.isClosed && h.frequency === 'DAILY' && (!h.targetDaysOfWeek || h.targetDaysOfWeek.length === 0 || h.targetDaysOfWeek.includes(currentDayOfWeek)));
    const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr || t.repeatType === 'DAILY' || (!t.dueDate && !t.isCompleted));
    const completedHabitsCount = dailyHabitsToday.filter(h => !!h.completionHistory[todayStr]).length;
    const completedTasksCount = todayTasks.filter(t => t.isCompleted).length;
    scopeCompleted = completedHabitsCount + completedTasksCount;
    scopeTotal = Math.max(1, dailyHabitsToday.length + todayTasks.length);
  } else if (timeScope === 'WEEK') {
    scopeLabel = 'استمرار این هفته';
    const daysPassedInWeek = currentDayOfWeek + 1;
    scopeTotal = Math.max(1, habits.length * daysPassedInWeek);
    
    habits.forEach(h => {
      Object.entries(h.completionHistory || {}).forEach(([dateStr, isDone]) => {
        if (!isDone) return;
        const parsed = parseJalaliString(dateStr);
        if (parsed && parsed.year === today.year && parsed.month === today.month) {
          if (today.day - parsed.day >= 0 && today.day - parsed.day <= currentDayOfWeek) {
            scopeCompleted++;
          }
        }
      });
    });
  } else if (timeScope === 'MONTH') {
    scopeLabel = `عملکرد ماه ${PERSIAN_MONTHS[today.month - 1]}`;
    scopeTotal = Math.max(1, habits.length * today.day);

    habits.forEach(h => {
      Object.entries(h.completionHistory || {}).forEach(([dateStr, isDone]) => {
        if (!isDone) return;
        const parsed = parseJalaliString(dateStr);
        if (parsed && parsed.year === today.year && parsed.month === today.month) {
          scopeCompleted++;
        }
      });
    });
  }

  const basicEffectivePercent = scopeTotal > 0 ? Math.min(100, Math.round((scopeCompleted / scopeTotal) * 100)) : 0;

  // Botanical calculations for SEASON
  const seasonSummary: SeasonGardenSummary = React.useMemo(() => {
    return calculateSeasonGardenSummary(activeSeasonIdx, activeYear, goals, tasks, habits);
  }, [activeSeasonIdx, activeYear, goals, tasks, habits]);

  // Botanical calculations for YEAR
  const yearSummary: YearGardenSummary = React.useMemo(() => {
    return calculateYearGardenSummary(activeYear, goals, tasks, habits);
  }, [activeYear, goals, tasks, habits]);

  // Determine overall effective percent, stage, and focal plant
  let effectivePercent = basicEffectivePercent;
  let stageTitle = 'بذر در خاک حاصلخیز';
  let focalPlant = 'برگ انجیری';
  let climateNote = 'هوای باغچه معتدل و مساعد رشد';

  if (timeScope === 'SEASON') {
    effectivePercent = seasonSummary.overallProgressPercent;
    stageTitle = seasonSummary.botanicalStageTitle;
    focalPlant = seasonSummary.focalPlant;
    climateNote = seasonSummary.weatherStatus;
  } else if (timeScope === 'YEAR') {
    effectivePercent = yearSummary.overallProgressPercent;
    stageTitle = yearSummary.botanicalStageTitle;
    focalPlant = yearSummary.focalPlant;
    climateNote = yearSummary.weatherStatus;
  } else {
    // Stage title for day / week / month
    if (effectivePercent >= 100) stageTitle = 'شکوفایی کامل و عطر گل‌ها';
    else if (effectivePercent >= 75) stageTitle = 'گل‌دهی و طراوت شاداب';
    else if (effectivePercent >= 50) stageTitle = 'جوانه پربرگ و رشید';
    else if (effectivePercent >= 25) stageTitle = 'ساقه سبز و نورس';
    else stageTitle = 'بذر در خاک حاصلخیز';

    // If there are bloomed flowers, take the plant of the most recent bloomed flower as focal
    if (bloomedFlowers.length > 0) {
      focalPlant = bloomedFlowers[0].plantType;
    }
  }

  // Habits to display in quick water row
  // In DAY scope, ONLY show daily habits (exclude weekly habits so they don't leak into day view)
  const displayHabitsInRow = React.useMemo(() => {
    if (timeScope === 'DAY') {
      return habits.filter(h => !h.isClosed && h.frequency === 'DAILY' && (!h.targetDaysOfWeek || h.targetDaysOfWeek.length === 0 || h.targetDaysOfWeek.includes(currentDayOfWeek)));
    }
    // In WEEK or other scopes, show all active habits
    return habits.filter(h => !h.isClosed);
  }, [habits, timeScope, currentDayOfWeek]);

  return (
    <div className={`bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/30 rounded-2xl border border-emerald-100/90 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Header: Title and Time Scope Tabs (امروز / این هفته / این ماه / فصل‌ها / یک سال) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-100/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
              <span>باغچه رشد و شکوفایی</span>
              {timeScope === 'SEASON' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                  {SEASON_META[activeSeasonIdx].icon} {SEASON_META[activeSeasonIdx].name}
                </span>
              )}
              {timeScope === 'YEAR' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                  سال {toPersianDigits(activeYear)}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {timeScope === 'SEASON' ? `خلاصه باغچه فصل ${SEASON_META[activeSeasonIdx].name}:` : 
               timeScope === 'YEAR' ? `خلاصه باغچه سالانه ${toPersianDigits(activeYear)}:` :
               `${scopeLabel}:`} <span className="font-bold text-emerald-700">{toPersianDigits(effectivePercent)}٪</span>
            </p>
          </div>
        </div>

        {/* Time Scope Segmented Control */}
        <div className="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTimeScope('DAY')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              timeScope === 'DAY'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            امروز
          </button>
          <button
            type="button"
            onClick={() => setTimeScope('WEEK')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              timeScope === 'WEEK'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            این هفته
          </button>
          <button
            type="button"
            onClick={() => setTimeScope('MONTH')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              timeScope === 'MONTH'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            این ماه
          </button>
          <button
            type="button"
            onClick={() => setTimeScope('SEASON')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              timeScope === 'SEASON'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>فصل‌ها</span>
            <span className="text-[10px] opacity-75">({SEASON_META[activeSeasonIdx].name})</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeScope('YEAR')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              timeScope === 'YEAR'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>یک سال</span>
            <span className="text-[10px] opacity-75">({toPersianDigits(activeYear)})</span>
          </button>
        </div>
      </div>

      {/* Sub-selector for SEASON (4 Seasons Tabs) */}
      {timeScope === 'SEASON' && (
        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-emerald-900 ml-1 shrink-0">انتخاب فصل:</span>
            {SEASON_META.map((meta) => {
              const isSelected = activeSeasonIdx === meta.index;
              const isCurrent = currentSeasonIndex === meta.index && activeYear === today.year;
              return (
                <button
                  key={meta.index}
                  type="button"
                  onClick={() => setActiveSeasonIdx(meta.index)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-gray-700 border-emerald-200/80 hover:bg-emerald-50'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.name}</span>
                  {isCurrent && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      جاری
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Year selector if multiple years available */}
          {availableYears.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-gray-500 font-medium">سال:</span>
              <select
                value={activeYear}
                onChange={(e) => setActiveYear(Number(e.target.value))}
                className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 focus:outline-none"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{toPersianDigits(y)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Sub-selector for YEAR */}
      {timeScope === 'YEAR' && availableYears.length > 1 && (
        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-emerald-900">انتخاب سال برای پایش باغچه سالانه:</span>
          <div className="flex items-center gap-1.5">
            {availableYears.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeYear === y
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                سال {toPersianDigits(y)} {y === today.year && '(امسال)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Peaceful Garden Stage */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-white/90 rounded-xl border border-emerald-100/70 p-4 sm:p-5">
        {/* Centerpiece Focal Growing Plant */}
        <div className="flex flex-col items-center justify-center text-center shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Soft ambient botanical aura */}
            <div className="absolute inset-0 rounded-full bg-emerald-100/40 blur-lg" />
            <PlantIcon type={focalPlant} size="xl" animated={effectivePercent > 50} />
          </div>

          <div className="mt-2 space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
              <Sprout className="w-3 h-3 text-emerald-600" />
              <span>{stageTitle}</span>
            </span>
          </div>
        </div>

        {/* Progress & Serene Summary Content */}
        <div className="w-full sm:flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800">
              {timeScope === 'SEASON' ? `میزان رشد باغچه ${seasonSummary.seasonName}:` :
               timeScope === 'YEAR' ? `میزان شکوفایی کل سال ${toPersianDigits(activeYear)}:` :
               'میزان رشد و آبیاری:'}
            </span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {toPersianDigits(effectivePercent)}٪
            </span>
          </div>

          {/* Clean Progress Bar */}
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${effectivePercent}%` }}
            />
          </div>

          {/* Contextual Metrics per Mode */}
          {timeScope === 'SEASON' ? (
            /* Seasonal Summary Cards */
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">اهداف فصلی</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(seasonSummary.completedGoalsCount)} از {toPersianDigits(seasonSummary.goalsCount)} هدف
                  </strong>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">تسک‌های فصل</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(seasonSummary.completedTasksCount)} از {toPersianDigits(seasonSummary.tasksCount)} تسک
                  </strong>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-500 block">آبیاری عادات در فصل</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(seasonSummary.habitWateringDaysCount)} بار ثبت
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                <span className="text-gray-500">
                  ماه‌های فصل: <strong className="text-gray-800">{seasonSummary.monthsText}</strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{climateNote}</span>
                </span>
              </div>
            </div>
          ) : timeScope === 'YEAR' ? (
            /* Year Summary Cards & 4 Season Mini-Bars */
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">کل اهداف سال</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(yearSummary.allGoalsCount)} هدف
                  </strong>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">تسک‌های انجام‌شده</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(yearSummary.completedTasksCount)} از {toPersianDigits(yearSummary.totalTasksCount)}
                  </strong>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">پرورش عادات</span>
                  <strong className="text-emerald-950 text-xs font-extrabold mt-0.5 block">
                    {toPersianDigits(yearSummary.totalHabitWaterings)} بار آبیاری
                  </strong>
                </div>
              </div>

              {/* 4 Seasons Overview Row */}
              <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-200/70 space-y-1.5">
                <div className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                  <span>خلاصه چهار فصل سال:</span>
                  <span className="text-emerald-700 font-extrabold text-[10px]">
                    میانگین عملکرد: {toPersianDigits(effectivePercent)}٪
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  {yearSummary.seasons.map((s) => (
                    <button
                      key={s.seasonIndex}
                      type="button"
                      onClick={() => {
                        setActiveSeasonIdx(s.seasonIndex);
                        setTimeScope('SEASON');
                      }}
                      className="bg-white p-2 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all text-right cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-800 flex items-center gap-1">
                          <span>{s.icon}</span>
                          <span>{s.seasonName}</span>
                        </span>
                        <span className="font-extrabold text-emerald-700 text-[10px]">
                          {toPersianDigits(s.overallProgressPercent)}٪
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-emerald-500 group-hover:bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${s.overallProgressPercent}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-0.5">
                <span className="text-gray-500">
                  اهداف سالانه تکمیل‌شده: <strong className="text-emerald-800">{toPersianDigits(yearSummary.completedAnnualGoalsCount)}</strong> از <strong className="text-gray-900">{toPersianDigits(yearSummary.annualGoalsCount)}</strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{climateNote}</span>
                </span>
              </div>
            </div>
          ) : (
            /* Day / Week / Month Standard Footer */
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 pt-1">
              <span>
                انجام‌شده: <strong className="text-gray-900">{toPersianDigits(scopeCompleted)}</strong> از <strong className="text-gray-900">{toPersianDigits(scopeTotal)}</strong> فرصت
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Sun className="w-3 h-3 text-amber-500" />
                <span>{climateNote}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Botanical Blooming Garden Bed: Shows an individual flower for each completed item */}
      {(timeScope === 'DAY' || timeScope === 'WEEK' || timeScope === 'MONTH') && (
        <div className="bg-emerald-900/5 rounded-xl border border-emerald-200/70 p-3 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                <Flower2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span className="text-xs font-bold text-gray-900">
                {timeScope === 'DAY' ? 'گل‌های شکوفا شده امروز' :
                 timeScope === 'WEEK' ? 'گل‌های شکوفا شده این هفته' :
                 'گل‌های شکوفا شده این ماه'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-200">
                {toPersianDigits(bloomedFlowers.length)} گل به بار نشسته
              </span>
            </div>
            {bloomedFlowers.length > 0 && (
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>باغچه شکوفا و زنده</span>
              </span>
            )}
          </div>

          {bloomedFlowers.length > 0 ? (
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {bloomedFlowers.map((flower) => (
                <div
                  key={flower.id}
                  className="bg-white rounded-xl border border-emerald-200/90 shadow-2xs p-2.5 flex flex-col items-center text-center min-w-[125px] sm:min-w-[135px] max-w-[145px] shrink-0 hover:shadow-xs transition-all"
                >
                  <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                    <div className="absolute inset-0 rounded-full bg-emerald-100/60 blur-xs" />
                    <PlantIcon type={flower.plantType} size="md" animated />
                  </div>
                  <span className="text-xs font-bold text-gray-900 truncate w-full" title={flower.title}>
                    {flower.title}
                  </span>
                  <div className="flex items-center gap-1 mt-1.5 w-full justify-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      flower.kind === 'HABIT' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {flower.kind === 'HABIT' ? 'عادت' : 'تسک'}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      <span>شکوفا</span>
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 truncate w-full">
                    {flower.plantType}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 rounded-xl border border-dashed border-emerald-200/70 p-3.5 text-center">
              <p className="text-xs font-semibold text-emerald-900">
                {timeScope === 'DAY'
                  ? 'هنوز گلی در باغچه امروز شکوفا نشده است 🌱'
                  : 'هنوز گلی در این بازه ثبت نشده است 🌱'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                با تیک زدن هر تسک یا ثبت هر عادت، گل اختصاصی آن جداگانه در این باغچه خواهد رویید!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sleek Minimalist Plant Quick-Row for daily habits */}
      {displayHabitsInRow.length > 0 && timeScope !== 'YEAR' && timeScope !== 'SEASON' && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 px-0.5">
            <span className="font-semibold text-gray-700">
              {timeScope === 'DAY' ? 'عادت‌های روزانه امروز:' : 'عادت‌های فعال:'}
            </span>
            <span>برای آبیاری کلیک کنید</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            {displayHabitsInRow.map((h) => {
              const isDoneToday = !!h.completionHistory[todayStr];
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onWaterHabit(h.id)}
                  title={isDoneToday ? 'آب‌یاری شده' : 'آب‌یاری این گیاه'}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isDoneToday
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-white border-gray-200/80 text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  <PlantIcon type={h.plantType} size="xs" />
                  <span className="font-semibold text-[11px] truncate max-w-[110px]">{h.title}</span>
                  {isDoneToday ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                      <Droplets className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
