import React, { useState } from 'react';
import { Goal, AppTask, Habit, GoalStatus, Category } from '../types';
import { toPersianDigits, PERSIAN_MONTHS, getTodayJalali, jalaliToFormattedString } from '../calendar/jalali';
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
import { SeasonRolloverModal } from './SeasonRolloverModal';

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

  // Modal states for Progress adjustment & Rollover
  const [selectedGoalForProgress, setSelectedGoalForProgress] = useState<Goal | null>(null);
  const [rolloverGoal, setRolloverGoal] = useState<Goal | null>(null);
  const [rolloverTargetSeasonIdx, setRolloverTargetSeasonIdx] = useState<number>(0);
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
        totalHabitChecks += Object.values(h.completionHistory || {}).filter(Boolean).length;
      });
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
    return { progress: auto, isManual: false, auto };
  };

  const topLevelGoals = (goals || []).filter(g => !g.parentId || g.period === 'ANNUAL' || !goals.some(p => p.id === g.parentId));
  const getSubGoals = (parentId: string) => (goals || []).filter(g => g.parentId === parentId);
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

  // Find any past season goals with pending uncompleted items for automatic rollover suggestion
  const pastSeasonGoalsWithPending = goals.filter(g => {
    if (g.period !== 'SEASONAL' || g.seasonIndex === undefined) return false;
    const isPast = g.year < today.year || (g.year === today.year && g.seasonIndex < currentSeasonIdx);
    if (!isPast) return false;
    const pendingTasks = tasks.filter(t => t.goalId === g.id && !t.isCompleted);
    const linkedHabits = habits.filter(h => h.goalId === g.id);
    return pendingTasks.length > 0 || linkedHabits.length > 0;
  });

  const firstPendingRolloverGoal = pastSeasonGoalsWithPending[0];

  const handleOpenRolloverModal = (goal: Goal, targetIdx?: number) => {
    const nextIdx = targetIdx !== undefined ? targetIdx : (((goal.seasonIndex ?? 0) + 1) % 4);
    setRolloverGoal(goal);
    setRolloverTargetSeasonIdx(nextIdx);
  };

  const handleConfirmRollover = (fromGoalId: string, targetIdx: number) => {
    onTransferSeasonItems?.(fromGoalId, targetIdx);
    setRolloverGoal(null);
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

      {/* Automatic Rollover Notification Banner for Ended Season */}
      {!dismissedRolloverNotice && firstPendingRolloverGoal && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Repeat className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">انتقال تسک‌ها و عادات فصل گذشته:</span>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                فصل {SEASON_CONFIG[firstPendingRolloverGoal.seasonIndex ?? 0]?.name} پایان یافته و تسک‌های انجام‌نشده دارد. مایلید به فصل جاری منتقل شوند؟
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenRolloverModal(firstPendingRolloverGoal, currentSeasonIdx)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <span>انتقال به فصل جدید</span>
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
                {/* Top Row: Info & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Year Indicator */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isCurrentYear
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-gray-700 bg-gray-50 border-gray-200'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span>سال {toPersianDigits(annual.year)}</span>
                      </span>

                      {/* Category Badge */}
                      {annualCat && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          style={{
                            backgroundColor: `${annualCat.colorHex}15`,
                            color: annualCat.colorHex,
                            borderColor: `${annualCat.colorHex}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: annualCat.colorHex }}
                          />
                          <span>{annualCat.title}</span>
                        </span>
                      )}

                      {/* Plant Icon Badge */}
                      {annual.plantType && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                          <PlantIcon type={annual.plantType} size="xs" />
                          <span>{annual.plantType}</span>
                        </span>
                      )}

                      {/* Status */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-2 flex items-center gap-2">
                      <span>{annual.title}</span>
                    </h3>

                    {annual.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {annual.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
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
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100 space-y-3.5">
                    {/* 4 Seasons Minimal Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SEASON_CONFIG.map((sConfig, sIdx) => {
                        const seasonalGoal = subGoals.find(g => g.period === 'SEASONAL' && g.seasonIndex === sIdx);
                        const isPast = annual.year < today.year || (annual.year === today.year && sIdx < currentSeasonIdx);
                        const isCurrent = annual.year === today.year && sIdx === currentSeasonIdx;
                        const pendingTasksForSeason = seasonalGoal ? tasks.filter(t => t.goalId === seasonalGoal.id && !t.isCompleted) : [];

                        return (
                          <div
                            key={sIdx}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                              seasonalGoal
                                ? sConfig.cardBg
                                : isCurrent
                                ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-200'
                                : 'bg-gray-50/60 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 flex items-center gap-1 text-[11px]">
                                <span>{sConfig.icon}</span>
                                <span>{sConfig.name}</span>
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  فصل جاری
                                </span>
                              )}
                              {isPast && (
                                <span className="text-[9px] text-gray-400">گذشته</span>
                              )}
                            </div>

                            <div className="mt-2 pt-1 border-t border-black/5">
                              {seasonalGoal ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-gray-800 truncate block">
                                    {seasonalGoal.title}
                                  </span>
                                  <div className="flex items-center justify-between text-[10px] text-emerald-800">
                                    <span>پیشرفت:</span>
                                    <span className="font-bold">{toPersianDigits(getEffectiveGoalProgress(seasonalGoal).progress)}٪</span>
                                  </div>
                                  {isPast && pendingTasksForSeason.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRolloverModal(seasonalGoal, (sIdx + 1) % 4)}
                                      className="w-full mt-1 py-0.5 px-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[9px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Repeat className="w-2.5 h-2.5" />
                                      <span>انتقال به بعد</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onNewGoal(annual.id, 'SEASONAL', sIdx)}
                                  className="w-full py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>هدف {sConfig.name}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Intermediate Goals Action Row */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>اهداف میانی ({toPersianDigits(subGoals.length)})</span>
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNewGoal(annual.id, 'SEASONAL')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ هدف فصلی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNewGoal(annual.id, 'MONTHLY')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ هدف ماهانه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNewTaskForGoal(annual.id)}
                          className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-lg border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ تسک سالانه</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-Goals List */}
                    {subGoals.length > 0 && (
                      <div className="space-y-3 pr-2 border-r-2 border-emerald-200">
                        {subGoals.map((sub) => {
                          const { progress: subProgress, isManual: isSubManual } = getEffectiveGoalProgress(sub);
                          const subTasks = getTasksForGoal(sub.id);
                          const subHabits = getHabitsForGoal(sub.id);
                          const isSeasonal = sub.period === 'SEASONAL' && sub.seasonIndex !== undefined;
                          const seasonTheme = isSeasonal && sub.seasonIndex !== undefined && SEASON_CONFIG[sub.seasonIndex] ? SEASON_CONFIG[sub.seasonIndex] : null;
                          const pendingTasksCount = subTasks.filter(t => !t.isCompleted).length;

                          return (
                            <div
                              key={sub.id}
                              className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                                seasonTheme ? seasonTheme.cardBg : 'bg-gray-50/60 border-gray-200'
                              }`}
                            >
                              {/* Sub Goal Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isSeasonal && seasonTheme && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${seasonTheme.badgeClass}`}>
                                        <span>{seasonTheme.icon}</span>
                                        <span>فصل {seasonTheme.name}</span>
                                      </span>
                                    )}
                                    {sub.period === 'MONTHLY' && sub.monthIndex && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 border border-teal-300 text-teal-900">
                                        ماه {PERSIAN_MONTHS[(Number(sub.monthIndex) - 1 + 12) % 12]}
                                      </span>
                                    )}
                                    {sub.plantType && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-white border border-emerald-200 px-1.5 py-0.2 rounded-md font-medium">
                                        <PlantIcon type={sub.plantType} size="xs" />
                                        <span>{sub.plantType}</span>
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-1">
                                    {sub.title}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Rollover button for seasonal goal */}
                                  {isSeasonal && (pendingTasksCount > 0 || subHabits.length > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRolloverModal(sub)}
                                      title="انتقال تسک‌ها و عادات به فصل بعد"
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Repeat className="w-3 h-3 text-amber-600" />
                                      <span>انتقال به فصل بعد</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => onEditGoal(sub)}
                                    title="ویرایش"
                                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteGoal(sub.id)}
                                    title="حذف"
                                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar for sub-goal */}
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">پیشرفت:</span>
                                  <strong className="font-bold text-emerald-800">{toPersianDigits(subProgress)}٪</strong>
                                  <span className="text-[9px] text-gray-400">
                                    {isSubManual ? '(دستی)' : '(خودکار)'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedGoalForProgress(sub)}
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

                              {/* Action to add task / habit to this sub-goal */}
                              <div className="flex items-center justify-between pt-1 text-[10px]">
                                <span className="text-gray-500">
                                  اقدامات: {toPersianDigits(subTasks.length)} تسک | {toPersianDigits(subHabits.length)} عادت
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onNewTaskForGoal(sub.id)}
                                    className="px-2 py-0.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                  >
                                    + تسک
                                  </button>
                                  {onNewHabitForGoal && (
                                    <button
                                      type="button"
                                      onClick={() => onNewHabitForGoal(sub.id)}
                                      className="px-2 py-0.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded font-semibold transition-colors cursor-pointer"
                                    >
                                      + عادت
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Compact Tasks & Habits List for Sub-goal */}
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
                                          <PlantIcon type={habit.plantType} size="xs" />
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
                                <PlantIcon type={h.plantType} size="xs" />
                                <span>{h.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

      {/* Season Rollover Modal */}
      <SeasonRolloverModal
        isOpen={Boolean(rolloverGoal)}
        fromGoal={rolloverGoal}
        targetSeasonIndex={rolloverTargetSeasonIdx}
        tasks={tasks}
        habits={habits}
        onClose={() => setRolloverGoal(null)}
        onConfirm={handleConfirmRollover}
      />
    </div>
  );
};
