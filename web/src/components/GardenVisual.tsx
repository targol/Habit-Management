import React, { useState } from 'react';
import { PlantState, Habit, Goal } from '../types';
import { PlantIcon } from './PlantIcon';
import { 
  toPersianDigits, 
  getTodayJalali, 
  jalaliToFormattedString,
  parseJalaliString,
  PERSIAN_MONTHS,
  getDayOfWeek
} from '../calendar/jalali';
import { Sparkles, Droplets, Sun, Check, Calendar, Sprout, Leaf } from 'lucide-react';

interface Props {
  plantState: PlantState;
  habits: Habit[];
  goals: Goal[];
  onWaterHabit: (habitId: string) => void;
}

export const GardenVisual: React.FC<Props> = ({
  plantState,
  habits,
  goals,
  onWaterHabit,
}) => {
  const [timeScope, setTimeScope] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentDayOfWeek = getDayOfWeek(today); // 0=Saturday .. 6=Friday

  // Calculate stats based on chosen Time Scope (روز / هفته / ماه)
  let scopeCompleted = 0;
  let scopeTotal = 0;
  let scopeLabel = '';

  if (timeScope === 'DAY') {
    scopeLabel = 'پیشرفت کارهای امروز';
    scopeTotal = habits.length;
    scopeCompleted = habits.filter(h => !!h.completionHistory[todayStr]).length;
  } else if (timeScope === 'WEEK') {
    scopeLabel = 'استمرار این هفته';
    // Days in current week up to today (Saturday to today = currentDayOfWeek + 1)
    const daysPassedInWeek = currentDayOfWeek + 1;
    scopeTotal = Math.max(1, habits.length * daysPassedInWeek);
    
    // Count completions in the last 7 days
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
  } else {
    scopeLabel = `عملکرد ماه ${PERSIAN_MONTHS[today.month - 1]}`;
    // Days in month up to today
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

  const effectivePercent = scopeTotal > 0 ? Math.min(100, Math.round((scopeCompleted / scopeTotal) * 100)) : 0;

  // Derive dynamic botanical stage based on current scope's progress
  let currentStage = 'SEED';
  let stageTitle = 'بذر در خاک حاصلخیز';
  let focalPlant = 'برگ انجیری';

  if (effectivePercent >= 90) {
    currentStage = 'FULL_BLOOM';
    stageTitle = 'درختچه بارور و شکوفا';
    focalPlant = 'درختچه زیتون';
  } else if (effectivePercent >= 65) {
    currentStage = 'FLOWERING';
    stageTitle = 'شکوفایی گل‌ها و شاخه‌ها';
    focalPlant = 'بونسای';
  } else if (effectivePercent >= 40) {
    currentStage = 'BUDDING';
    stageTitle = 'نهال استوار با غنچه‌های تازه';
    focalPlant = 'بامبو شانس';
  } else if (effectivePercent >= 15) {
    currentStage = 'SPROUT';
    stageTitle = 'جوانه سبز و باطراوت';
    focalPlant = 'برگ انجیری';
  } else {
    currentStage = 'SEED';
    stageTitle = 'بذر آماده رویش و آبیاری';
    focalPlant = 'ریحان و نعنا';
  }

  return (
    <div className="bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/30 rounded-2xl border border-emerald-100/90 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header: Title and Time Scope Tabs (روز / هفته / ماه) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-950">
              باغچه رشد و شکوفایی
            </h3>
            <p className="text-[11px] text-gray-500">
              {scopeLabel}: <span className="font-bold text-emerald-700">{toPersianDigits(effectivePercent)}٪</span>
            </p>
          </div>
        </div>

        {/* Time Scope Segmented Control */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTimeScope('DAY')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeScope === 'MONTH'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            این ماه
          </button>
        </div>
      </div>

      {/* Main Peaceful Garden Stage */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-white/80 rounded-xl border border-emerald-100/70 p-4">
        {/* Centerpiece Focal Growing Plant */}
        <div className="flex flex-col items-center justify-center text-center">
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

        {/* Minimal Progress & Serene Summary */}
        <div className="w-full sm:flex-1 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800">
              میزان رشد و آبیاری:
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 pt-1">
            <span>
              انجام‌شده: <strong className="text-gray-900">{toPersianDigits(scopeCompleted)}</strong> از <strong className="text-gray-900">{toPersianDigits(scopeTotal)}</strong> فرصت
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Sun className="w-3 h-3 text-amber-500" />
              <span>{effectivePercent >= 80 ? 'هوای باغچه کاملاً آفتابی' : 'هوای باغچه معتدل و مساعد رشد'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Minimalist Plant Quick-Row (خلوت و بدون کارت‌های تکراری سنگین) */}
      {habits.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
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
