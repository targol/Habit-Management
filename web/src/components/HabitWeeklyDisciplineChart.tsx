import React, { useState, useMemo, useEffect } from 'react';
import { Habit, Category } from '../types';
import { 
  getTodayJalali, 
  addDaysJalali, 
  jalaliToFormattedString, 
  toPersianDigits, 
  WEEKDAYS, 
  WEEKDAYS_SHORT, 
  PERSIAN_MONTHS, 
  isDateHoliday, 
  getDayOfWeek 
} from '../calendar/jalali';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { 
  Flame, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Award, 
  Calendar, 
  Check, 
  Minus, 
  Info, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';

interface Props {
  habits: Habit[];
  categories?: Category[];
  className?: string;
}

export interface DayHabitStat {
  dayIndex: number; // 0 (Saturday) to 6 (Friday)
  dayName: string;
  dayShortName: string;
  dateStr: string; // "1405/07/07"
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isHoliday: boolean;
  holidayTitle?: string;
  scheduledHabits: Habit[];
  completedHabits: Habit[];
  missedHabits: Habit[];
  scheduledCount: number;
  completedCount: number;
  fulfillmentRate: number; // 0 to 100
}

/**
 * Normalizes date string to YYYY/MM/DD
 */
function normalizeDate(str?: string | null): string {
  if (!str) return '';
  const trimmed = str.trim().split(' ')[0].split('-')[0].trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
  }
  return trimmed;
}

/**
 * Check if habit was completed on specific date
 */
function isHabitDone(habit: Habit, targetDateStr: string): boolean {
  if (!habit.completionHistory) return false;
  const norm = normalizeDate(targetDateStr);
  if (habit.completionHistory[norm] || habit.completionHistory[targetDateStr]) return true;

  const parts = norm.split('/');
  if (parts.length === 3) {
    const unpadded = `${parts[0]}/${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
    if (habit.completionHistory[unpadded]) return true;
  }
  return false;
}

/**
 * Checks if a habit is planned / scheduled for a day of week
 */
function isHabitScheduledForDay(habit: Habit, dow: number, isHoliday: boolean): boolean {
  if (habit.isClosed) return false;
  if (habit.exemptHolidays && isHoliday) return false;
  if (habit.exemptWeekends && dow === 6) return false; // Friday

  if (habit.frequency === 'DAILY') {
    if (!habit.targetDaysOfWeek || habit.targetDaysOfWeek.length === 0) return true;
    return habit.targetDaysOfWeek.includes(dow);
  }

  if (habit.frequency === 'WEEKLY') {
    if (habit.targetDaysOfWeek && habit.targetDaysOfWeek.length > 0) {
      return habit.targetDaysOfWeek.includes(dow);
    }
    return true;
  }

  return true;
}

export const HabitWeeklyDisciplineChart: React.FC<Props> = ({
  habits,
  categories = [],
  className = '',
}) => {
  // Mounting guard for Recharts container calculation
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const today = useMemo(() => getTodayJalali(), []);
  const todayStr = useMemo(() => jalaliToFormattedString(today), [today]);
  const currentDOW = useMemo(() => getDayOfWeek(today), [today]);

  // Week offset state (0 = current week, -1 = previous week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // View mode: 'PERCENTAGE' (درصد تحقق) vs 'COUNT' (تعداد عادات)
  const [metricMode, setMetricMode] = useState<'PERCENTAGE' | 'COUNT'>('PERCENTAGE');

  // Selected Day for drilldown inspection (defaults to today in current week)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Target anchor date
  const anchorDate = useMemo(() => {
    return addDaysJalali(today, weekOffset * 7);
  }, [today, weekOffset]);

  // Calculate the 7 days of the Persian week (Saturday to Friday)
  const weekDaysData = useMemo(() => {
    const anchorDOW = getDayOfWeek(anchorDate);
    const saturday = addDaysJalali(anchorDate, -anchorDOW);

    const list: DayHabitStat[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDaysJalali(saturday, i);
      const dateStr = jalaliToFormattedString(d);
      const holidayInfo = isDateHoliday(d);
      const isDayHoliday = holidayInfo.isHoliday || holidayInfo.isFriday;

      const isCurrentDay = dateStr === todayStr;
      const isPastDay = dateStr < todayStr;
      const isFutureDay = dateStr > todayStr;

      // Filter habits scheduled for this day
      const scheduledHabits = habits.filter(h => isHabitScheduledForDay(h, i, isDayHoliday));

      // Habits actually checked/done on this day
      const completedHabits = habits.filter(h => isHabitDone(h, dateStr));

      // Habits scheduled but missed
      const missedHabits = scheduledHabits.filter(h => !isHabitDone(h, dateStr));

      const scheduledCount = scheduledHabits.length;
      const completedCount = completedHabits.length;

      let fulfillmentRate = 0;
      if (scheduledCount > 0) {
        fulfillmentRate = Math.min(100, Math.round((completedCount / scheduledCount) * 100));
      } else if (completedCount > 0) {
        fulfillmentRate = 100;
      }

      list.push({
        dayIndex: i,
        dayName: WEEKDAYS[i],
        dayShortName: WEEKDAYS_SHORT[i],
        dateStr,
        dayNumber: d.day,
        monthName: PERSIAN_MONTHS[d.month - 1],
        isToday: isCurrentDay,
        isPast: isPastDay,
        isFuture: isFutureDay,
        isHoliday: isDayHoliday,
        holidayTitle: holidayInfo.title,
        scheduledHabits,
        completedHabits,
        missedHabits,
        scheduledCount,
        completedCount,
        fulfillmentRate,
      });
    }

    return list;
  }, [anchorDate, todayStr, habits]);

  // Keep selected day synchronized if week changes
  useEffect(() => {
    const match = weekDaysData.find(d => d.dateStr === selectedDateStr);
    if (!match && weekDaysData.length > 0) {
      const todayInWeek = weekDaysData.find(d => d.isToday);
      setSelectedDateStr(todayInWeek ? todayInWeek.dateStr : weekDaysData[0].dateStr);
    }
  }, [weekDaysData, selectedDateStr]);

  // Selected Day Stat
  const selectedDay = useMemo(() => {
    return weekDaysData.find(d => d.dateStr === selectedDateStr) || weekDaysData[0];
  }, [weekDaysData, selectedDateStr]);

  // Summary Metrics for the week (evaluating days up to today or all past days)
  const elapsedDays = useMemo(() => {
    return weekDaysData.filter(d => !d.isFuture);
  }, [weekDaysData]);

  const activeHabitsCount = useMemo(() => {
    return habits.filter(h => !h.isClosed).length;
  }, [habits]);

  // Average weekly fulfillment rate
  const averageDisciplineRate = useMemo(() => {
    if (elapsedDays.length === 0) return 0;
    const sum = elapsedDays.reduce((acc, d) => acc + d.fulfillmentRate, 0);
    return Math.round(sum / elapsedDays.length);
  }, [elapsedDays]);

  // Days with discipline >= 80%
  const highDisciplineDaysCount = useMemo(() => {
    return elapsedDays.filter(d => d.fulfillmentRate >= 80).length;
  }, [elapsedDays]);

  // Total completed checks in this week
  const totalCompletedChecksInWeek = useMemo(() => {
    return weekDaysData.reduce((acc, d) => acc + d.completedCount, 0);
  }, [weekDaysData]);

  // Best day of the week
  const peakDisciplineDay = useMemo(() => {
    const sorted = [...elapsedDays].sort((a, b) => b.fulfillmentRate - a.fulfillmentRate);
    return sorted.length > 0 && sorted[0].completedCount > 0 ? sorted[0] : null;
  }, [elapsedDays]);

  // Habits with 100% adherence throughout the elapsed days of this week
  const perfectHabitsThisWeek = useMemo(() => {
    if (elapsedDays.length === 0) return [];
    return habits.filter(h => {
      if (h.isClosed) return false;
      // Habit must have been done on every day it was scheduled
      let scheduledAtLeastOnce = false;
      for (const day of elapsedDays) {
        const scheduled = isHabitScheduledForDay(h, day.dayIndex, day.isHoliday);
        if (scheduled) {
          scheduledAtLeastOnce = true;
          if (!isHabitDone(h, day.dateStr)) return false;
        }
      }
      return scheduledAtLeastOnce;
    });
  }, [habits, elapsedDays]);

  // Week range label e.g. "شنبه ۳ مهر تا جمعه ۹ مهر ۱۴۰۵"
  const weekRangeLabel = useMemo(() => {
    if (weekDaysData.length < 7) return '';
    const start = weekDaysData[0];
    const end = weekDaysData[6];
    return `${start.dayName} ${toPersianDigits(start.dayNumber)} ${start.monthName} تا ${end.dayName} ${toPersianDigits(end.dayNumber)} ${end.monthName}`;
  }, [weekDaysData]);

  // Recharts Dataset
  const chartDataset = useMemo(() => {
    return weekDaysData.map(d => ({
      dayKey: `day_${d.dayIndex}`,
      dayName: d.dayName,
      dayShortName: d.dayShortName,
      dayNumber: d.dayNumber,
      persianDayNumber: toPersianDigits(d.dayNumber),
      dateStr: d.dateStr,
      fulfillmentRate: d.fulfillmentRate,
      completedCount: d.completedCount,
      scheduledCount: d.scheduledCount,
      isToday: d.isToday,
      isFuture: d.isFuture,
      isHoliday: d.isHoliday,
      raw: d,
    }));
  }, [weekDaysData]);

  // Color determination for bars
  const getBarColor = (item: typeof chartDataset[0], isSelected: boolean) => {
    if (item.isFuture) {
      return isSelected ? '#CBD5E1' : '#E2E8F0';
    }
    if (item.fulfillmentRate >= 90) return '#059669'; // Emerald-600
    if (item.fulfillmentRate >= 70) return '#10B981'; // Emerald-500
    if (item.fulfillmentRate >= 40) return '#F59E0B'; // Amber-500
    if (item.completedCount > 0) return '#FB923C'; // Orange-400
    return '#E11D48'; // Rose-600 (0% on elapsed day)
  };

  // Custom Tick Component
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || payload.value === undefined) return null;
    const item = chartDataset[payload.index];
    if (!item) return null;

    const isSelected = item.dateStr === selectedDateStr;
    const isToday = item.isToday;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill={isSelected ? '#059669' : isToday ? '#10B981' : item.isFuture ? '#9CA3AF' : '#374151'}
          fontSize={11}
          fontWeight={isToday || isSelected ? 800 : 600}
          fontFamily="Vazirmatn, sans-serif"
        >
          {item.dayShortName}
        </text>
        <text
          x={0}
          y={0}
          dy={28}
          textAnchor="middle"
          fill={isSelected ? '#059669' : isToday ? '#10B981' : '#9CA3AF'}
          fontSize={10}
          fontWeight={isToday ? 700 : 500}
        >
          {item.persianDayNumber}
        </text>
        {isToday && (
          <circle cx={0} cy={34} r={2} fill="#10B981" />
        )}
      </g>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataItem = payload[0]?.payload;
    const raw: DayHabitStat = dataItem?.raw;
    if (!raw) return null;

    return (
      <div 
        className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-200/90 shadow-xl text-right text-xs space-y-2 min-w-[190px]"
        dir="rtl"
      >
        <div className="border-b border-gray-100 pb-1.5 flex items-center justify-between gap-2">
          <div className="font-bold text-gray-900">
            {raw.dayName}، {toPersianDigits(raw.dayNumber)} {raw.monthName}
          </div>
          {raw.isToday ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              امروز
            </span>
          ) : raw.isFuture ? (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
              پیش‌رو
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-emerald-800 font-semibold">
            <span>درصد تحقق نظم:</span>
            <span className="text-sm font-extrabold font-mono">{toPersianDigits(raw.fulfillmentRate)}٪</span>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span>عادت‌های انجام‌شده:</span>
            <span className="font-bold">{toPersianDigits(raw.completedCount)} از {toPersianDigits(raw.scheduledCount)}</span>
          </div>

          {raw.completedHabits.length > 0 && (
            <div className="pt-1 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 block mb-1">ثبت‌شده‌ها:</span>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {raw.completedHabits.slice(0, 3).map(h => (
                  <span key={h.id} className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {h.title}
                  </span>
                ))}
                {raw.completedHabits.length > 3 && (
                  <span className="text-[10px] text-gray-400">
                    +{toPersianDigits(raw.completedHabits.length - 3)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-gray-400 pt-1 text-center">
          برای انتخاب و مشاهده کامل کلیک کنید
        </div>
      </div>
    );
  };

  const getCategory = (catId?: string) => categories.find(c => c.id === catId);

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100/90 shadow-sm space-y-6 ${className}`}>
      {/* 1. Header with Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  نمودار تحقق و استمرار عادات در هفته جاری
                </h3>
                {weekOffset === 0 ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                    هفته جاری
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {weekOffset < 0 ? `${toPersianDigits(Math.abs(weekOffset))} هفته قبل` : `${toPersianDigits(weekOffset)} هفته بعد`}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{weekRangeLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* View Switches & Week Pager */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Mode switch: Percentage vs Count */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/80 text-xs">
            <button
              type="button"
              onClick={() => setMetricMode('PERCENTAGE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                metricMode === 'PERCENTAGE'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              درصد تحقق (٪)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('COUNT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                metricMode === 'COUNT'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              تعداد عادات
            </button>
          </div>

          {/* Week Pagination */}
          <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200/80 p-0.5">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="هفته قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                امروز
              </button>
            )}
            <button
              type="button"
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="هفته بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Discipline KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Average Consistency */}
        <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
            <span className="font-semibold">میانگین انضباط</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-mono">
            {toPersianDigits(averageDisciplineRate)}٪
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            پایبندی روزانه تا امروز
          </p>
        </div>

        {/* Card 2: High Discipline Days */}
        <div className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span className="font-semibold">روزهای منظم</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">
            {toPersianDigits(highDisciplineDaysCount)} <span className="text-xs font-normal text-amber-700">روز</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            تحقق بالای ۸۰٪ در این هفته
          </p>
        </div>

        {/* Card 3: Total Completed Checks */}
        <div className="bg-teal-50/50 rounded-2xl p-3.5 border border-teal-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-teal-800 mb-1">
            <span className="font-semibold">کل ثبت‌های موفق</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-950 font-mono">
            {toPersianDigits(totalCompletedChecksInWeek)} <span className="text-xs font-normal text-teal-700">بار</span>
          </div>
          <p className="text-[11px] text-teal-700/80 mt-1">
            از {toPersianDigits(activeHabitsCount)} عادت فعال
          </p>
        </div>

        {/* Card 4: Perfect Habits Streak */}
        <div className="bg-indigo-50/50 rounded-2xl p-3.5 border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-indigo-800 mb-1">
            <span className="font-semibold">عادات با نظم ۱۰۰٪</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 font-mono">
            {toPersianDigits(perfectHabitsThisWeek.length)} <span className="text-xs font-normal text-indigo-700">عادت</span>
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-1">
            بدون وقفه در روزهای گذشته
          </p>
        </div>
      </div>

      {/* 3. The Main Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>عالی (۹۰٪+)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>خوب (۷۰٪-۸۹٪)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>متوسط (۴۰٪-۶۹٪)</span>
            </span>
            <span className="flex items-center gap-1.5 hidden sm:inline-flex">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span>نیاز به تقویت (۰٪)</span>
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium hidden md:block">
            روی هر ستون کلیک کنید تا وضعیت روز مشخص شود
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4 pb-2 bg-emerald-50/20 rounded-2xl border border-emerald-100/60 relative">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataset}
                margin={{ top: 20, right: 12, left: -10, bottom: 25 }}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const clickedItem = state.activePayload[0].payload;
                    if (clickedItem && clickedItem.dateStr) {
                      setSelectedDateStr(clickedItem.dateStr);
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="dayKey" 
                  tick={<CustomXAxisTick />}
                  interval={0}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={metricMode === 'PERCENTAGE' ? [0, 100] : [0, 'dataMax + 2']}
                  ticks={metricMode === 'PERCENTAGE' ? [0, 25, 50, 75, 80, 100] : undefined}
                  tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Vazirmatn' }}
                  tickFormatter={(val) => metricMode === 'PERCENTAGE' ? `${toPersianDigits(val)}٪` : toPersianDigits(val)}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
                
                {/* 80% Benchmark Reference Line for discipline goal */}
                {metricMode === 'PERCENTAGE' && (
                  <ReferenceLine 
                    y={80} 
                    stroke="#10B981" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: 'خط انضباط ایده‌آل (۸۰٪)', 
                      position: 'top', 
                      fill: '#059669', 
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: 'Vazirmatn'
                    }} 
                  />
                )}

                <Bar 
                  dataKey={metricMode === 'PERCENTAGE' ? 'fulfillmentRate' : 'completedCount'} 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                  className="cursor-pointer transition-all duration-300"
                >
                  {chartDataset.map((entry) => {
                    const isSelected = entry.dateStr === selectedDateStr;
                    return (
                      <Cell 
                        key={`cell-${entry.dayKey}`} 
                        fill={getBarColor(entry, isSelected)}
                        stroke={isSelected ? '#047857' : 'none'}
                        strokeWidth={isSelected ? 2.5 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Interactive Drilldown Section for Selected Day */}
      {selectedDay && (
        <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-900">
                  بررسی جزئیات عادات روز {selectedDay.dayName} ({toPersianDigits(selectedDay.dayNumber)} {selectedDay.monthName})
                </span>
                {selectedDay.isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    امروز
                  </span>
                )}
                {selectedDay.isFuture && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    روز پیش‌رو
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedDay.isFuture 
                  ? 'برنامه عاداتی که برای این روز در نظر گرفته شده است'
                  : `در این روز ${toPersianDigits(selectedDay.completedCount)} از ${toPersianDigits(selectedDay.scheduledCount)} عادت تحقق یافته است (${toPersianDigits(selectedDay.fulfillmentRate)}٪)`
                }
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-gray-700">
                درصد تحقق روز:
              </span>
              <span className={`text-base font-black px-2.5 py-0.5 rounded-xl font-mono ${
                selectedDay.fulfillmentRate >= 80 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : selectedDay.fulfillmentRate >= 50 
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
              }`}>
                {toPersianDigits(selectedDay.fulfillmentRate)}٪
              </span>
            </div>
          </div>

          {/* List of habits for this selected day */}
          {selectedDay.scheduledHabits.length === 0 && selectedDay.completedHabits.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">
              هیچ عادتی برای این روز برنامه‌ریزی نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Show completed habits first */}
              {selectedDay.completedHabits.map((habit) => {
                const cat = getCategory(habit.categoryId);
                return (
                  <div
                    key={`done-${habit.id}`}
                    className="bg-white rounded-xl border border-emerald-200 p-3 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <PlantIcon type={habit.plantType} size="xs" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {habit.title}
                        </p>
                        {cat && (
                          <span className="text-[10px] text-gray-400 block truncate">
                            {cat.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>ثبت شده</span>
                    </div>
                  </div>
                );
              })}

              {/* Show missed or scheduled habits */}
              {selectedDay.missedHabits.map((habit) => {
                const cat = getCategory(habit.categoryId);
                return (
                  <div
                    key={`missed-${habit.id}`}
                    className={`bg-white rounded-xl border p-3 flex items-center justify-between shadow-2xs transition-colors ${
                      selectedDay.isFuture ? 'border-gray-200 opacity-80' : 'border-rose-200/80 bg-rose-50/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        <PlantIcon type={habit.plantType} size="xs" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {habit.title}
                        </p>
                        {cat && (
                          <span className="text-[10px] text-gray-400 block truncate">
                            {cat.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-[11px] font-medium ${
                      selectedDay.isFuture 
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-rose-50 text-rose-700 font-bold'
                    }`}>
                      {selectedDay.isFuture ? (
                        <span>در انتظار</span>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>انجام‌نشده</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Habit Discipline Matrix for This Week */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>ماتریس پیوستگی تک‌تک عادات در طول هفته</span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              نمای کلی وضعیت ثبت هر عادت از شنبه تا جمعه
            </p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {toPersianDigits(activeHabitsCount)} عادت فعال
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] text-gray-400">
                <th className="py-2 pr-2 font-medium">عادت</th>
                {weekDaysData.map(d => (
                  <th key={d.dayIndex} className="py-2 px-1.5 text-center font-medium min-w-[34px]">
                    <span className={d.isToday ? 'text-emerald-700 font-bold' : ''}>
                      {d.dayShortName}
                    </span>
                  </th>
                ))}
                <th className="py-2 pl-2 text-center font-medium min-w-[50px]">پایبندی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {habits.filter(h => !h.isClosed).map(habit => {
                const cat = getCategory(habit.categoryId);

                // Calculate adherence for this habit in this week
                let habitScheduledDays = 0;
                let habitCompletedDays = 0;

                weekDaysData.forEach(d => {
                  const scheduled = isHabitScheduledForDay(habit, d.dayIndex, d.isHoliday);
                  const done = isHabitDone(habit, d.dateStr);
                  if (scheduled && !d.isFuture) {
                    habitScheduledDays++;
                    if (done) habitCompletedDays++;
                  }
                });

                const habitRate = habitScheduledDays > 0 
                  ? Math.round((habitCompletedDays / habitScheduledDays) * 100) 
                  : 0;

                return (
                  <tr key={habit.id} className="hover:bg-emerald-50/20 transition-colors">
                    {/* Habit Title & Icon */}
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2 min-w-[130px]">
                        <PlantIcon type={habit.plantType} size="xs" />
                        <span className="font-bold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">
                          {habit.title}
                        </span>
                      </div>
                    </td>

                    {/* 7 Days Indicators */}
                    {weekDaysData.map(d => {
                      const scheduled = isHabitScheduledForDay(habit, d.dayIndex, d.isHoliday);
                      const done = isHabitDone(habit, d.dateStr);

                      return (
                        <td key={d.dayIndex} className="py-2.5 px-1.5 text-center">
                          {!scheduled ? (
                            <span className="inline-block w-4 h-4 text-gray-300">
                              <Minus className="w-3.5 h-3.5 mx-auto" />
                            </span>
                          ) : done ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : d.isFuture ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200" title="روز پیش‌رو" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Weekly Rate Percentage */}
                    <td className="py-2.5 pl-2 text-center">
                      <span className={`text-[11px] font-extrabold font-mono ${
                        habitRate >= 80 
                          ? 'text-emerald-700' 
                          : habitRate >= 50 
                            ? 'text-amber-600' 
                            : 'text-gray-400'
                      }`}>
                        {toPersianDigits(habitRate)}٪
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
