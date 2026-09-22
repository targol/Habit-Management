import React, { useState } from 'react';
import { PlantState, Habit, Goal, AppTask } from '../types';
import { PlantIcon } from './PlantIcon';
import { 
  toPersianDigits, 
  getTodayJalali, 
  jalaliToFormattedString,
  parseJalaliString,
  PERSIAN_MONTHS,
  getDayOfWeek
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
  Compass
} from 'lucide-react';
import { 
  calculateSeasonGardenSummary, 
  calculateYearGardenSummary, 
  SEASON_META,
  getSeasonForMonth,
  SeasonGardenSummary,
  YearGardenSummary
} from '../utils/gardenCalculations';

interface Props {
  plantState?: PlantState;
  habits: Habit[];
  goals: Goal[];
  tasks?: AppTask[];
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

  // Calculations for DAY / WEEK / MONTH
  let scopeCompleted = 0;
  let scopeTotal = 0;
  let scopeLabel = '';

  if (timeScope === 'DAY') {
    scopeLabel = 'پیشرفت کارهای امروز';
    scopeTotal = habits.length;
    scopeCompleted = habits.filter(h => !!h.completionHistory[todayStr]).length;
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
    if (effectivePercent >= 90) {
      stageTitle = 'درختچه بارور و شکوفا';
      focalPlant = 'درختچه زیتون';
      climateNote = 'هوای باغچه کاملاً آفتابی و پرطراوت';
    } else if (effectivePercent >= 65) {
      stageTitle = 'شکوفایی گل‌ها و شاخه‌ها';
      focalPlant = 'بونسای';
      climateNote = 'هوای باغچه آفتابی و معتدل';
    } else if (effectivePercent >= 40) {
      stageTitle = 'نهال استوار با غنچه‌های تازه';
      focalPlant = 'بامبو شانس';
      climateNote = 'هوای باغچه بهاری و ملایم';
    } else if (effectivePercent >= 15) {
      stageTitle = 'جوانه سبز و باطراوت';
      focalPlant = 'برگ انجیری';
      climateNote = 'نسیم ملایم و آماده رشد بیشتر';
    } else {
      stageTitle = 'بذر آماده رویش و آبیاری';
      focalPlant = 'ریحان و نعنا';
      climateNote = 'خاک تشنه و آماده دریافت اولین قطرات آب';
    }
  }

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

      {/* Sleek Minimalist Plant Quick-Row for daily habits */}
      {habits.length > 0 && timeScope !== 'YEAR' && (
        <div className="pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            {habits.map((h) => {
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
