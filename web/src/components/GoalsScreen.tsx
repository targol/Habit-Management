import React, { useState } from 'react';
import { Goal, AppTask, Habit, GoalStatus, Category } from '../types';
import { toPersianDigits, PERSIAN_MONTHS, getTodayJalali, jalaliToFormattedString, parseJalaliString } from '../calendar/jalali';
import { 
  Plus, 
  Target, 
  Trash2, 
  Edit3, 
  History, 
  Calendar, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  Play, 
  Layers, 
  CheckSquare, 
  PlayCircle,
  PauseCircle,
  Tag,
  Sliders,
  Repeat,
  AlertCircle,
  X
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';
import { GoalProgressModal } from './GoalProgressModal';
import { TransferPeriodItemsModal } from './TransferPeriodItemsModal';
import { EntityIcon, EntityBadge } from './EntityIcon';

interface Props {
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  categories: Category[];
  onOpenAnnualWizard: () => void;
  onNewGoal: (parentId?: string | null, period?: 'ANNUAL' | 'SEASONAL' | 'MONTHLY', seasonIndex?: number) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewHistory: (goal: Goal) => void;
  onNewTaskForGoal: (goalId: string) => void;
  onNewHabitForGoal?: (goalId: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleHabitToday?: (habitId: string) => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
  onUpdateGoalProgress?: (goalId: string, manualProgress: number | null, isManualActive: boolean) => void;
  onTransferSeasonItems?: (fromGoalId: string, targetSeasonIndex?: number) => void;
  onTransferGoalItems?: (
    fromGoalId: string,
    targetGoalId: string,
    options: { transferTasks: boolean; transferHabits: boolean }
  ) => void;
  onCreateTargetAndTransfer?: (
    fromGoal: Goal,
    targetTitle: string,
    targetPeriod: 'SEASONAL' | 'MONTHLY' | 'ANNUAL',
    targetSeasonIndex?: number,
    targetMonthIndex?: number,
    targetYear?: number
  ) => void;
}

const SEASON_CONFIG = [
  {
    name: 'بهار',
    months: 'فروردین، اردیبهشت، خرداد',
    icon: '🌸',
    cardBg: 'bg-emerald-50/50 border-emerald-200 border-r-4 border-r-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    progressBar: 'bg-gradient-to-r from-emerald-500 to-green-600',
  },
  {
    name: 'تابستان',
    months: 'تیر، مرداد، شهریور',
    icon: '☀️',
    cardBg: 'bg-amber-50/50 border-amber-200 border-r-4 border-r-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-600',
  },
  {
    name: 'پاییز',
    months: 'مهر، آبان، آذر',
    icon: '🍂',
    cardBg: 'bg-orange-50/50 border-orange-200 border-r-4 border-r-orange-500',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    progressBar: 'bg-gradient-to-r from-orange-500 to-amber-600',
  },
  {
    name: 'زمستان',
    months: 'دی، بهمن، اسفند',
    icon: '❄️',
    cardBg: 'bg-sky-50/50 border-sky-200 border-r-4 border-r-sky-500',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-600',
  },
];

export const GoalsScreen: React.FC<Props> = ({
  goals,
  tasks,
  habits,
  categories,
  onOpenAnnualWizard,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
  onViewHistory,
  onNewTaskForGoal,
  onNewHabitForGoal,
  onToggleTask,
  onToggleHabitToday,
  onOpenTimer,
  onUpdateGoalProgress,
  onTransferSeasonItems,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentSeasonIdx = Math.floor((today.month - 1) / 3);

  // States
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string | number>('ALL');

  // Modal states for Progress adjustment & Transfer
  const [selectedGoalForProgress, setSelectedGoalForProgress] = useState<Goal | null>(null);
  const [transferGoal, setTransferGoal] = useState<Goal | null>(null);
  const [dismissedRolloverNotice, setDismissedRolloverNotice] = useState<boolean>(false);

  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Recursively collect all descendant IDs with cycle prevention
  const getGoalDescendantIds = (goalId: string, visited = new Set<string>()): string[] => {
    if (visited.has(goalId)) return [];
    visited.add(goalId);
    const directChildren = (goals || []).filter(g => g && g.parentId === goalId && g.id !== goalId);
    const grandChildIds = directChildren.flatMap(c => getGoalDescendantIds(c.id, visited));
    return [goalId, ...directChildren.map(c => c.id), ...grandChildIds];
  };

  // Compute automatic progress for a goal based on linked tasks and habits
  const calculateAutoGoalProgress = (goalId: string): number => {
    const targetGoal = (goals || []).find(g => g && g.id === goalId);
    if (!targetGoal) return 0;

    // A goal for a future season or future month that has not arrived yet should NOT score automatically (0%)
    const goalYear = targetGoal.year || today.year;
    if (goalYear > today.year) {
      return 0;
    }
    if (goalYear === today.year) {
      if (targetGoal.period === 'SEASONAL' && targetGoal.seasonIndex !== undefined) {
        if (targetGoal.seasonIndex > currentSeasonIdx) {
          // Future season in the current year: has not arrived yet!
          return 0;
        }
      }
      if (targetGoal.period === 'MONTHLY' && targetGoal.monthIndex !== undefined) {
        if (targetGoal.monthIndex > today.month) {
          // Future month in the current year: has not arrived yet!
          return 0;
        }
      }
    }

    const allRelevantGoalIds = getGoalDescendantIds(goalId);

    const linkedTasks = (tasks || []).filter(t => t && t.goalId && allRelevantGoalIds.includes(t.goalId));
    const linkedHabits = (habits || []).filter(h => h && h.goalId && allRelevantGoalIds.includes(h.goalId));

    if (linkedTasks.length === 0 && linkedHabits.length === 0) {
      return 0;
    }

    let score = 0;
    let maxScore = 0;

    if (linkedTasks.length > 0) {
      const completedTasks = linkedTasks.filter(t => t.isCompleted).length;
      score += (completedTasks / linkedTasks.length) * 60;
      maxScore += 60;
    }

    if (linkedHabits.length > 0) {
      let totalHabitChecks = 0;
      linkedHabits.forEach(h => {
        const historyEntries = Object.entries(h.completionHistory || {});
        historyEntries.forEach(([dateStr, isDone]) => {
          if (!isDone) return;
          const parsed = parseJalaliString(dateStr);
          if (!parsed) return;

          // For seasonal/monthly goals, only count habit checks within the goal's relevant period
          if (targetGoal.year && parsed.year !== targetGoal.year) return;

          if (targetGoal.period === 'SEASONAL' && targetGoal.seasonIndex !== undefined) {
            const seasonStartMonth = targetGoal.seasonIndex * 3 + 1;
            const seasonEndMonth = seasonStartMonth + 2;
            if (parsed.month < seasonStartMonth || parsed.month > seasonEndMonth) return;
          }

          if (targetGoal.period === 'MONTHLY' && targetGoal.monthIndex !== undefined) {
            if (parsed.month !== targetGoal.monthIndex) return;
          }

          totalHabitChecks++;
        });
      });

      // Calibrate habit contribution based on checks within the timeframe
      const habitPortion = Math.min(1, totalHabitChecks / (linkedHabits.length * 10));
      score += habitPortion * 40;
      maxScore += 40;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  // Effective progress: returns manual progress if active, otherwise auto calculated
  const getEffectiveGoalProgress = (goal: Goal): { progress: number; isManual: boolean; auto: number } => {
    const auto = calculateAutoGoalProgress(goal.id);
    if (goal.isManualProgressActive && goal.manualProgress !== undefined && goal.manualProgress !== null) {
      return { progress: Math.max(0, Math.min(100, goal.manualProgress)), isManual: true, auto };
    }
    if (goal.status === 'COMPLETED') {
      return { progress: 100, isManual: true, auto };
    }
    return { progress: auto, isManual: false, auto };
  };

  const topLevelGoals = (goals || [])
    .filter(g => !g.parentId || g.period === 'ANNUAL' || !goals.some(p => p.id === g.parentId))
    .sort((a, b) => {
      // Annual goals: sort by year descending (latest first), then by creation date
      const aYear = a.year || today.year;
      const bYear = b.year || today.year;
      if (aYear !== bYear) return bYear - aYear;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

  const getSubGoals = (parentId: string) => {
    const list = (goals || []).filter(g => g.parentId === parentId);
    return list.sort((a, b) => {
      // 1. Both seasonal: sort chronologically by seasonIndex (0: بهار, 1: تابستان, 2: پاییز, 3: زمستان)
      if (a.period === 'SEASONAL' && b.period === 'SEASONAL') {
        const aYear = a.year || today.year;
        const bYear = b.year || today.year;
        if (aYear !== bYear) return aYear - bYear;
        return (a.seasonIndex ?? 0) - (b.seasonIndex ?? 0);
      }
      // 2. Seasonal vs Monthly: order by calendar sequence
      if (a.period === 'SEASONAL' && b.period === 'MONTHLY') {
        const aYear = a.year || today.year;
        const bYear = b.year || today.year;
        if (aYear !== bYear) return aYear - bYear;
        const aMonth = (a.seasonIndex ?? 0) * 3 + 1;
        return aMonth - (b.monthIndex ?? 1);
      }
      if (a.period === 'MONTHLY' && b.period === 'SEASONAL') {
        const aYear = a.year || today.year;
        const bYear = b.year || today.year;
        if (aYear !== bYear) return aYear - bYear;
        const bMonth = (b.seasonIndex ?? 0) * 3 + 1;
        return (a.monthIndex ?? 1) - bMonth;
      }
      // 3. Both monthly: sort by monthIndex (1 to 12)
      if (a.period === 'MONTHLY' && b.period === 'MONTHLY') {
        const aYear = a.year || today.year;
        const bYear = b.year || today.year;
        if (aYear !== bYear) return aYear - bYear;
        return (a.monthIndex ?? 1) - (b.monthIndex ?? 1);
      }
      // 4. Default: chronological by startDate or createdAt ascending
      return (a.startDate || a.createdAt || '').localeCompare(b.startDate || b.createdAt || '');
    });
  };
  const getTasksForGoal = (goalId: string) => (tasks || []).filter(t => t.goalId === goalId);
  const getHabitsForGoal = (goalId: string) => (habits || []).filter(h => h.goalId === goalId);

  // Available unique years in goals
  const availableYears = Array.from(new Set(goals.map(g => g.year || today.year))).sort((a, b) => a - b);
  if (!availableYears.includes(today.year)) {
    availableYears.push(today.year);
    availableYears.sort((a, b) => a - b);
  }

  const getStatusBadge = (s: GoalStatus) => {
    switch (s) {
      case 'COMPLETED':
        return { label: 'تکمیل شده', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 };
      case 'IN_PROGRESS':
        return { label: 'در حال انجام', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: PlayCircle };
      case 'PAUSED':
        return { label: 'متوقف', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: PauseCircle };
      case 'NOT_STARTED':
      default:
        return { label: 'شروع نشده', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Circle };
    }
  };

  const getCategory = (catId?: string) => categories.find(c => c.id === catId);

  // Filtered top-level goals by Category and Year
  const filteredTopLevelGoals = topLevelGoals.filter(g => {
    if (selectedCategoryFilter !== 'ALL' && g.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (selectedYearFilter !== 'ALL' && g.year !== Number(selectedYearFilter)) {
      return false;
    }
    return true;
  });

  // Find any past goals (seasonal, monthly, or past year) with pending uncompleted items
  const pastGoalsWithPending = goals.filter(g => {
    let isPast = false;
    if (g.period === 'SEASONAL' && g.seasonIndex !== undefined) {
      isPast = g.year < today.year || (g.year === today.year && g.seasonIndex < currentSeasonIdx);
    } else if (g.period === 'MONTHLY' && g.monthIndex !== undefined) {
      isPast = g.year < today.year || (g.year === today.year && g.monthIndex < today.month);
    } else if (g.period === 'ANNUAL') {
      isPast = g.year < today.year;
    }
    if (!isPast) return false;
    const pendingTasks = tasks.filter(t => t.goalId === g.id && !t.isCompleted);
    const linkedHabits = habits.filter(h => h.goalId === g.id);
    return pendingTasks.length > 0 || linkedHabits.length > 0;
  });

  const firstPendingRolloverGoal = pastGoalsWithPending[0];

  const handleOpenTransferModal = (goal: Goal) => {
    setTransferGoal(goal);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-14" dir="rtl">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span>اهداف و برنامه‌ریزی</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {toPersianDigits(goals.length)} هدف
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            اهداف سالانه، گام‌های میانی فصلی و اقدامات اجرایی
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAnnualWizard}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>طراحی هدف سالانه</span>
          </button>

          <button
            type="button"
            onClick={() => onNewGoal(null, 'ANNUAL')}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>هدف جدید</span>
          </button>
        </div>
      </div>

      {/* Automatic Rollover Notification Banner for Ended Period */}
      {!dismissedRolloverNotice && firstPendingRolloverGoal && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Repeat className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">انتقال تسک‌ها و عادات دوره پایان‌یافته:</span>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                دوره مربوط به «{firstPendingRolloverGoal.title}» به پایان رسیده و موارد تکمیل‌نشده دارد. مایلید به دوره بعد منتقل شوند؟
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTransferModal(firstPendingRolloverGoal)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Repeat className="w-3 h-3" />
              <span>انتقال به دوره جدید</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissedRolloverNotice(true)}
              className="p-1.5 text-amber-700 hover:text-amber-900 rounded-lg transition-colors cursor-pointer"
              title="بستن پیام"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Filter Pills: Year & Category */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-gray-200 text-xs">
        {/* Year Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-[11px] font-bold text-gray-500 shrink-0 ml-1">سال:</span>
          <button
            type="button"
            onClick={() => setSelectedYearFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              selectedYearFilter === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            همه
          </button>
          {availableYears.map((y) => {
            const isSelected = selectedYearFilter === y;
            const isCurrentYear = y === today.year;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYearFilter(y)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs font-bold'
                    : isCurrentYear
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {toPersianDigits(y)} {isCurrentYear && '(امسال)'}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-[11px] font-bold text-gray-500 shrink-0 ml-1">دسته:</span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            همه
          </button>
          {categories.map((c) => {
            const isSelected = selectedCategoryFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? 'text-white font-bold shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isSelected ? c.colorHex : undefined,
                  borderColor: isSelected ? c.colorHex : `${c.colorHex}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : c.colorHex }}
                />
                <span>{c.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Goals Cards List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-400 space-y-3">
          <Target className="w-8 h-8 text-emerald-600/40 mx-auto" />
          <p>هنوز هدفی ثبت نشده است.</p>
          <button
            type="button"
            onClick={onOpenAnnualWizard}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>شروع تعریف هدف</span>
          </button>
        </div>
      ) : filteredTopLevelGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500 space-y-2">
          <p>هدفی با این فیلتر یافت نشد.</p>
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('ALL'); setSelectedYearFilter('ALL'); }}
            className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            مشاهده همه اهداف
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopLevelGoals.map((annual) => {
            const { progress: effectiveProgress, isManual } = getEffectiveGoalProgress(annual);
            const subGoals = getSubGoals(annual.id);
            const directTasks = getTasksForGoal(annual.id);
            const directHabits = getHabitsForGoal(annual.id);
            const isExpanded = expandedGoals[annual.id] !== false; // default expanded
            const statusInfo = getStatusBadge(annual.status);
            const StatusIcon = statusInfo.icon;
            const annualCat = getCategory(annual.categoryId);
            const isCurrentYear = annual.year === today.year;

            return (
              <div
                key={annual.id}
                className="bg-white rounded-2xl border border-emerald-100/80 p-4 sm:p-5 shadow-xs transition-all space-y-3.5"
              >
                {/* Top Row: Title & Actions at the Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <EntityIcon type="ANNUAL_GOAL" size="sm" />
                      <h3 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
                        {annual.title}
                      </h3>
                    </div>

                    {annual.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {annual.description}
                      </p>
                    )}

                    {/* Meta Tags Row: Clean, subtle and less prominent than the title */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs">
                      {/* Entity Type Badge */}
                      <EntityBadge type="ANNUAL_GOAL" size="xs" />

                      {/* Category Badge */}
                      {annualCat && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                          style={{
                            backgroundColor: `${annualCat.colorHex}15`,
                            color: annualCat.colorHex,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: annualCat.colorHex }}
                          />
                          <span>{annualCat.title}</span>
                        </span>
                      )}

                      {/* Status */}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenTransferModal(annual)}
                      title="انتقال تسک‌ها و عادات این هدف"
                      className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewHistory(annual)}
                      title="تاریخچه"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditGoal(annual)}
                      title="ویرایش"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteGoal(annual.id)}
                      title="حذف"
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(annual.id)}
                      title={isExpanded ? 'بستن' : 'باز کردن'}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar with Manual / Auto Indicator & Adjust Button */}
                <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">میزان پیشرفت:</span>
                      <strong className="font-bold text-emerald-800 text-sm">
                        {toPersianDigits(effectiveProgress)}٪
                      </strong>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                        isManual 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {isManual ? 'ارزیابی دستی شما' : 'محاسبه خودکار'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGoalForProgress(annual)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="تغییر یا تنظیم درصد پیشرفت"
                    >
                      <Sliders className="w-3 h-3 text-emerald-600" />
                      <span>تنظیم درصد</span>
                    </button>
                  </div>

                  <div className="h-2 w-full bg-gray-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${effectiveProgress}%` }}
                    />
                  </div>
                </div>

                {/* Sub-goals and Seasons Strip */}
                {isExpanded && (() => {
                  // Filter seasons that have either a seasonal goal OR monthly goals
                  const activeSeasons = [0, 1, 2, 3].filter(sIdx => {
                    const sGoal = subGoals.find(g => g.period === 'SEASONAL' && g.seasonIndex === sIdx);
                    const mGoals = subGoals.filter(g => g.period === 'MONTHLY' && g.monthIndex && Math.floor((Number(g.monthIndex) - 1) / 3) === sIdx);
                    return Boolean(sGoal || mGoals.length > 0);
                  });

                  return (
                    <div className="pt-2 border-t border-gray-100 space-y-3.5">
                      {/* Intermediate Goals Action Row - Single Unified Action */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>اهداف میانی ({toPersianDigits(subGoals.length)})</span>
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onNewGoal(annual.id, 'SEASONAL', currentSeasonIdx)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ تعریف هدف میانی</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNewTaskForGoal(annual.id)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ تسک سالانه</span>
                          </button>
                        </div>
                      </div>

                      {/* If no sub-goals exist yet, show clean guidance card */}
                      {activeSeasons.length === 0 ? (
                        <div className="bg-gray-50/70 rounded-xl border border-dashed border-gray-200 p-4 text-center space-y-2">
                          <p className="text-xs text-gray-500">
                            هنوز هدف میانی (فصلی یا ماهانه) برای این هدف تعریف نشده است.
                          </p>
                          <button
                            type="button"
                            onClick={() => onNewGoal(annual.id, 'SEASONAL', currentSeasonIdx)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>تعریف اولین هدف میانی (فصل یا ماه)</span>
                          </button>
                        </div>
                      ) : (
                        /* Only display seasons that have defined goals */
                        <div className="space-y-3.5">
                          {activeSeasons.map((sIdx) => {
                            const sConfig = SEASON_CONFIG[sIdx];
                            const seasonalGoal = subGoals.find(g => g.period === 'SEASONAL' && g.seasonIndex === sIdx);
                            const monthlyGoals = subGoals.filter(g => g.period === 'MONTHLY' && g.monthIndex && Math.floor((Number(g.monthIndex) - 1) / 3) === sIdx);
                            const isPast = annual.year < today.year || (annual.year === today.year && sIdx < currentSeasonIdx);
                            const isCurrent = annual.year === today.year && sIdx === currentSeasonIdx;
                            const pendingTasksForSeason = seasonalGoal ? tasks.filter(t => t.goalId === seasonalGoal.id && !t.isCompleted) : [];

                            return (
                              <div
                                key={sIdx}
                                className={`rounded-xl border p-3.5 space-y-3 transition-all ${sConfig.cardBg}`}
                              >
                                {/* Season Header */}
                                <div className="flex items-center justify-between pb-1 border-b border-black/5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{sConfig.icon}</span>
                                    <span className="text-xs font-extrabold text-gray-900">
                                      فصل {sConfig.name}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.2 rounded-md">
                                        فصل جاری
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                                        گذشته
                                      </span>
                                    )}
                                  </div>

                                  {seasonalGoal && isPast && pendingTasksForSeason.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenTransferModal(seasonalGoal)}
                                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Repeat className="w-2.5 h-2.5" />
                                      <span>انتقال به بعد</span>
                                    </button>
                                  )}
                                </div>

                                {/* Seasonal Goal (if defined for this season) */}
                                {seasonalGoal && (() => {
                                  const { progress: subProgress, isManual: isSubManual } = getEffectiveGoalProgress(seasonalGoal);
                                  const subTasks = getTasksForGoal(seasonalGoal.id);
                                  const subHabits = getHabitsForGoal(seasonalGoal.id);

                                  return (
                                    <div className="bg-white/80 rounded-xl border border-black/5 p-3 space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <EntityIcon type="INTERMEDIATE_GOAL" size="xs" />
                                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                              هدف فصلی: {seasonalGoal.title}
                                            </h4>
                                            <EntityBadge type="INTERMEDIATE_GOAL" customLabel="فصلی" size="xs" />
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenTransferModal(seasonalGoal)}
                                            title="انتقال تسک‌ها و عادات به دوره بعد"
                                            className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                          >
                                            <Repeat className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onEditGoal(seasonalGoal)}
                                            title="ویرایش"
                                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onDeleteGoal(seasonalGoal.id)}
                                            title="حذف"
                                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Progress */}
                                      <div className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-gray-500">پیشرفت:</span>
                                          <strong className="font-bold text-emerald-800">{toPersianDigits(subProgress)}٪</strong>
                                          <span className="text-[9px] text-gray-400">{isSubManual ? '(دستی)' : '(خودکار)'}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setSelectedGoalForProgress(seasonalGoal)}
                                          className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          <Sliders className="w-2.5 h-2.5" />
                                          <span>تنظیم درصد</span>
                                        </button>
                                      </div>
                                      <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                                          style={{ width: `${subProgress}%` }}
                                        />
                                      </div>

                                      {/* Actions for Seasonal Goal */}
                                      <div className="flex items-center justify-between pt-1 text-[10px]">
                                        <span className="text-gray-500">
                                          اقدامات: {toPersianDigits(subTasks.length)} تسک | {toPersianDigits(subHabits.length)} عادت
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => onNewTaskForGoal(seasonalGoal.id)}
                                            className="px-2 py-0.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                          >
                                            + تسک
                                          </button>
                                          {onNewHabitForGoal && (
                                            <button
                                              type="button"
                                              onClick={() => onNewHabitForGoal(seasonalGoal.id)}
                                              className="px-2 py-0.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                            >
                                              + عادت
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Tasks & Habits for seasonal goal */}
                                      {(subTasks.length > 0 || subHabits.length > 0) && (
                                        <div className="space-y-1.5 pt-1 border-t border-black/5">
                                          {subTasks.map((task) => (
                                            <div
                                              key={task.id}
                                              className="p-1.5 rounded-lg bg-white/90 border border-black/5 flex items-center justify-between text-xs"
                                            >
                                              <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                                                <button
                                                  type="button"
                                                  onClick={() => onToggleTask(task.id)}
                                                  className="cursor-pointer text-emerald-600 shrink-0"
                                                >
                                                  {task.isCompleted ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                                                  ) : (
                                                    <Circle className="w-3.5 h-3.5 text-gray-300" />
                                                  )}
                                                </button>
                                                <EntityIcon type="TASK" size="xs" showBackground={false} />
                                                <span className={`truncate text-[11px] ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                                                  {task.title}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => onOpenTimer(task.title, Math.round(task.timerSecondsTarget / 60) || 25, () => onToggleTask(task.id))}
                                                className="p-1 text-gray-400 hover:text-emerald-700 cursor-pointer"
                                                title="تایمر تمرکز"
                                              >
                                                <Play className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          ))}

                                          {subHabits.map((habit) => {
                                            const isDoneToday = Boolean(habit.completionHistory?.[todayStr]);
                                            return (
                                              <div
                                                key={habit.id}
                                                className="p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs"
                                              >
                                                <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                                                  <button
                                                    type="button"
                                                    onClick={() => onToggleHabitToday?.(habit.id)}
                                                    className="cursor-pointer text-amber-600 shrink-0"
                                                  >
                                                    {isDoneToday ? (
                                                      <CheckCircle2 className="w-3.5 h-3.5 fill-amber-600 text-white" />
                                                    ) : (
                                                      <Circle className="w-3.5 h-3.5 text-gray-300" />
                                                    )}
                                                  </button>
                                                  <EntityIcon type="HABIT" size="xs" showBackground={false} />
                                                  <span className="truncate text-[11px] text-gray-800 font-medium">
                                                    {habit.title}
                                                  </span>
                                                </div>
                                                <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded shrink-0">
                                                  {habit.frequency === 'DAILY' ? 'روزانه' : 'هفتگی'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Monthly Goals Belonging to This Season - Nested Directly Inside */}
                                {monthlyGoals.length > 0 && (
                                  <div className="space-y-2 pt-1">
                                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                      <span>اهداف ماهانه در {sConfig.name}:</span>
                                    </span>

                                    <div className="space-y-2">
                                      {monthlyGoals.map((mGoal) => {
                                        const { progress: mProgress, isManual: isMManual } = getEffectiveGoalProgress(mGoal);
                                        const mTasks = getTasksForGoal(mGoal.id);
                                        const mHabits = getHabitsForGoal(mGoal.id);
                                        const monthNumber = Number(mGoal.monthIndex) || 1;
                                        const monthName = PERSIAN_MONTHS[(monthNumber - 1 + 12) % 12];

                                        return (
                                          <div
                                            key={mGoal.id}
                                            className="bg-white/90 rounded-xl border border-gray-200/90 p-3 space-y-2 shadow-2xs"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">
                                                    ماه {monthName}
                                                  </span>
                                                  <EntityIcon type="INTERMEDIATE_GOAL" size="xs" />
                                                  <h5 className="text-xs font-bold text-gray-900 truncate">
                                                    {mGoal.title}
                                                  </h5>
                                                  <EntityBadge type="INTERMEDIATE_GOAL" customLabel="ماهانه" size="xs" />
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenTransferModal(mGoal)}
                                                  title="انتقال تسک‌ها و عادات به دوره بعد"
                                                  className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                                >
                                                  <Repeat className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => onEditGoal(mGoal)}
                                                  title="ویرایش"
                                                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                                >
                                                  <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => onDeleteGoal(mGoal.id)}
                                                  title="حذف"
                                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="flex items-center justify-between text-[11px]">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">پیشرفت:</span>
                                                <strong className="font-bold text-emerald-800">{toPersianDigits(mProgress)}٪</strong>
                                                <span className="text-[9px] text-gray-400">{isMManual ? '(دستی)' : '(خودکار)'}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => setSelectedGoalForProgress(mGoal)}
                                                className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                              >
                                                <Sliders className="w-2.5 h-2.5" />
                                                <span>تنظیم درصد</span>
                                              </button>
                                            </div>
                                            <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                                style={{ width: `${mProgress}%` }}
                                              />
                                            </div>

                                            {/* Actions for Monthly Goal */}
                                            <div className="flex items-center justify-between pt-1 text-[10px]">
                                              <span className="text-gray-500">
                                                {toPersianDigits(mTasks.length)} تسک | {toPersianDigits(mHabits.length)} عادت
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => onNewTaskForGoal(mGoal.id)}
                                                  className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                                >
                                                  + تسک
                                                </button>
                                                {onNewHabitForGoal && (
                                                  <button
                                                    type="button"
                                                    onClick={() => onNewHabitForGoal(mGoal.id)}
                                                    className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                                  >
                                                    + عادت
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            {/* Tasks & Habits for monthly goal */}
                                            {(mTasks.length > 0 || mHabits.length > 0) && (
                                              <div className="space-y-1.5 pt-1 border-t border-black/5">
                                                {mTasks.map((task) => (
                                                  <div
                                                    key={task.id}
                                                    className="p-1.5 rounded-lg bg-white border border-gray-100 flex items-center justify-between text-xs"
                                                  >
                                                    <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                                                      <button
                                                        type="button"
                                                        onClick={() => onToggleTask(task.id)}
                                                        className="cursor-pointer text-teal-600 shrink-0"
                                                      >
                                                        {task.isCompleted ? (
                                                          <CheckCircle2 className="w-3.5 h-3.5 fill-teal-600 text-white" />
                                                        ) : (
                                                          <Circle className="w-3.5 h-3.5 text-gray-300" />
                                                        )}
                                                      </button>
                                                      <EntityIcon type="TASK" size="xs" showBackground={false} />
                                                      <span className={`truncate text-[11px] ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                                                        {task.title}
                                                      </span>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => onOpenTimer(task.title, Math.round(task.timerSecondsTarget / 60) || 25, () => onToggleTask(task.id))}
                                                      className="p-1 text-gray-400 hover:text-teal-700 cursor-pointer"
                                                      title="تایمر تمرکز"
                                                    >
                                                      <Play className="w-2.5 h-2.5" />
                                                    </button>
                                                  </div>
                                                ))}

                                                {mHabits.map((habit) => {
                                                  const isDoneToday = Boolean(habit.completionHistory?.[todayStr]);
                                                  return (
                                                    <div
                                                      key={habit.id}
                                                      className="p-1.5 rounded-lg bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs"
                                                    >
                                                      <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                                                        <button
                                                          type="button"
                                                          onClick={() => onToggleHabitToday?.(habit.id)}
                                                          className="cursor-pointer text-amber-600 shrink-0"
                                                        >
                                                          {isDoneToday ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 fill-amber-600 text-white" />
                                                          ) : (
                                                            <Circle className="w-3.5 h-3.5 text-gray-300" />
                                                          )}
                                                        </button>
                                                        <EntityIcon type="HABIT" size="xs" showBackground={false} />
                                                        <span className="truncate text-[11px] text-gray-800 font-medium">
                                                          {habit.title}
                                                        </span>
                                                      </div>
                                                      <span className="text-[9px] text-teal-800 bg-teal-100 px-1 py-0.2 rounded shrink-0">
                                                        {habit.frequency === 'DAILY' ? 'روزانه' : 'هفتگی'}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Direct Annual Tasks & Habits */}
                      {(directTasks.length > 0 || directHabits.length > 0) && (
                        <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5 text-xs">
                          <span className="font-bold text-blue-950 text-[11px] block">
                            تسک‌ها و عادات مستقیم هدف سالانه:
                          </span>
                          <div className="space-y-1">
                            {directTasks.map((t) => (
                              <div key={t.id} className="p-1.5 bg-white rounded-lg border border-blue-100 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <button type="button" onClick={() => onToggleTask(t.id)} className="cursor-pointer text-blue-600">
                                    {t.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" /> : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                                  </button>
                                  <EntityIcon type="TASK" size="xs" showBackground={false} />
                                  <span className={t.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}>{t.title}</span>
                                </div>
                              </div>
                            ))}
                            {directHabits.map((h) => (
                              <div key={h.id} className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <button type="button" onClick={() => onToggleHabitToday?.(h.id)} className="cursor-pointer text-amber-600">
                                    {h.completionHistory?.[todayStr] ? <CheckCircle2 className="w-3.5 h-3.5 fill-amber-600 text-white" /> : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                                  </button>
                                  <EntityIcon type="HABIT" size="xs" showBackground={false} />
                                  <span>{h.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Edit Modal */}
      <GoalProgressModal
        isOpen={Boolean(selectedGoalForProgress)}
        goal={selectedGoalForProgress}
        autoProgress={selectedGoalForProgress ? calculateAutoGoalProgress(selectedGoalForProgress.id) : 0}
        onClose={() => setSelectedGoalForProgress(null)}
        onSave={(goalId, manualProgress, isManualActive) => {
          onUpdateGoalProgress?.(goalId, manualProgress, isManualActive);
        }}
      />

      {/* Transfer Items Modal */}
      <TransferPeriodItemsModal
        isOpen={Boolean(transferGoal)}
        fromGoal={transferGoal}
        goals={goals}
        tasks={tasks}
        habits={habits}
        categories={categories}
        onClose={() => setTransferGoal(null)}
        onConfirmTransfer={(fromGoalId, targetGoalId, options) => {
          onTransferGoalItems?.(fromGoalId, targetGoalId, options);
          setTransferGoal(null);
        }}
        onCreateTargetAndTransfer={(fromGoal, targetTitle, targetPeriod, targetSeasonIndex, targetMonthIndex, targetYear) => {
          onCreateTargetAndTransfer?.(fromGoal, targetTitle, targetPeriod, targetSeasonIndex, targetMonthIndex, targetYear);
          setTransferGoal(null);
        }}
      />
    </div>
  );
};
