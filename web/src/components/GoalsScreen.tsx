import React, { useState } from 'react';
import { Goal, AppTask, Habit, GoalStatus, Category } from '../types';
import { toPersianDigits, PERSIAN_MONTHS, WEEKDAYS, WEEKS_OF_MONTH, getTodayJalali } from '../calendar/jalali';
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
  Clock, 
  Layers, 
  CheckSquare, 
  Flame, 
  FolderPlus,
  PlayCircle,
  PauseCircle,
  Filter,
  Tag
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';

interface Props {
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  categories: Category[];
  onOpenAnnualWizard: () => void;
  onNewGoal: (parentId?: string | null, period?: 'ANNUAL' | 'SEASONAL' | 'MONTHLY') => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewHistory: (goal: Goal) => void;
  onNewTaskForGoal: (goalId: string) => void;
  onToggleTask: (taskId: string) => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
}

const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

// Delicate seasonal badge & card styling with distinct colors for each season
const SEASON_CONFIG = [
  {
    name: 'بهار',
    icon: '🌸',
    cardBg: 'bg-emerald-50/70 border-emerald-300 border-r-4 border-r-emerald-500 shadow-xs shadow-emerald-100',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    progressBar: 'bg-gradient-to-r from-emerald-500 to-green-600',
    accentText: 'text-emerald-950',
  },
  {
    name: 'تابستان',
    icon: '☀️',
    cardBg: 'bg-amber-50/70 border-amber-300 border-r-4 border-r-amber-500 shadow-xs shadow-amber-100',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    accentText: 'text-amber-950',
  },
  {
    name: 'پاییز',
    icon: '🍂',
    cardBg: 'bg-orange-50/70 border-orange-300 border-r-4 border-r-orange-500 shadow-xs shadow-orange-100',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    progressBar: 'bg-gradient-to-r from-orange-500 to-amber-600',
    accentText: 'text-orange-950',
  },
  {
    name: 'زمستان',
    icon: '❄️',
    cardBg: 'bg-sky-50/70 border-sky-300 border-r-4 border-r-sky-500 shadow-xs shadow-sky-100',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-600',
    accentText: 'text-sky-950',
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
  onToggleTask,
  onOpenTimer,
}) => {
  const today = getTodayJalali();
  // Expanded goal cards state for collapse/expand
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string | number>('ALL');

  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Compute progress for a goal based on linked tasks and habits
  const calculateGoalProgress = (goalId: string) => {
    // Also include sub-goals' tasks
    const childGoals = goals.filter(g => g.parentId === goalId);
    const allRelevantGoalIds = [goalId, ...childGoals.map(c => c.id)];

    const linkedTasks = tasks.filter(t => t.goalId && allRelevantGoalIds.includes(t.goalId));
    const linkedHabits = habits.filter(h => h.goalId && allRelevantGoalIds.includes(h.goalId));

    if (linkedTasks.length === 0 && linkedHabits.length === 0) {
      return 0;
    }

    let score = 0;
    let maxScore = 0;

    if (linkedTasks.length > 0) {
      const completedTasks = linkedTasks.filter(t => t.isCompleted).length;
      score += (completedTasks / linkedTasks.length) * 70;
      maxScore += 70;
    }

    if (linkedHabits.length > 0) {
      let totalHabitChecks = 0;
      linkedHabits.forEach(h => {
        totalHabitChecks += Object.values(h.completionHistory).filter(Boolean).length;
      });
      const habitPortion = Math.min(1, totalHabitChecks / (linkedHabits.length * 15));
      score += habitPortion * 30;
      maxScore += 30;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  // Top level goals: either marked as ANNUAL or goals without a parentId
  const topLevelGoals = goals.filter(g => !g.parentId || g.period === 'ANNUAL');
  const getSubGoals = (parentId: string) => goals.filter(g => g.parentId === parentId);
  const getTasksForGoal = (goalId: string) => tasks.filter(t => t.goalId === goalId);

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

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Annual Planning CTA Banner */}
      <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600/60 border border-emerald-400/30 text-emerald-100 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مرکز برنامه‌ریزی و طراحی اهداف سالانه</span>
            </div>
            <h2 className="text-base font-bold text-white">
              تعریف اهداف سالانه (ابتدای سال یا در طول سال)
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
              اهداف کلان را مشخص کنید، آن‌ها را به گام‌های میانی فصلی/ماهانه بشکنید و با تسک‌های ریزتر هفتگی و روزانه محقق سازید.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAnnualWizard}
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all transform hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>طراحی و ثبت هدف سالانه جدید</span>
          </button>
        </div>
      </div>

      {/* Header and Quick Add */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>سلسله‌مراتب اهداف: سالانه ⬅️ میانی (فصل/ماه) ⬅️ تسک‌های خرد (هفته/روز)</span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            مجموع اهداف ثبت شده: {toPersianDigits(goals.length)} هدف
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNewGoal(null, 'ANNUAL')}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن سریع هدف</span>
        </button>
      </div>

      {/* Filter Bars: Year and Category */}
      <div className="space-y-2 bg-white/70 p-2.5 rounded-2xl border border-gray-200/80">
        {/* Year Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-gray-600 shrink-0 ml-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>سال:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedYearFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              selectedYearFilter === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            همه سال‌ها
          </button>

          {availableYears.map((y) => {
            const isSelected = selectedYearFilter === y;
            const isCurrentYear = y === today.year;
            const isFutureYear = y > today.year;
            const diff = y - today.year;
            const count = goals.filter(g => g.year === y).length;

            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYearFilter(y)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs font-bold'
                    : isCurrentYear
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : isFutureYear
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>سال {toPersianDigits(y)}</span>
                {isCurrentYear && <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-emerald-600 font-bold'}`}>(امسال)</span>}
                {isFutureYear && <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-indigo-600 font-bold'}`}>(+{toPersianDigits(diff)})</span>}
                <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  ({toPersianDigits(count)})
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-gray-600 shrink-0 ml-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>دسته:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            همه دسته‌ها ({toPersianDigits(goals.length)})
          </button>

          {categories.map((c) => {
            const count = goals.filter(g => g.categoryId === c.id).length;
            const isSelected = selectedCategoryFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-xs font-bold'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isSelected ? c.colorHex : undefined,
                  borderColor: !isSelected ? `${c.colorHex}40` : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : c.colorHex }}
                />
                <span>{c.title}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  ({toPersianDigits(count)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-400 space-y-3">
          <Target className="w-8 h-8 text-emerald-600/40 mx-auto" />
          <p>هنوز هدفی تعریف نشده است. مسیر موفقیت با یک چشم‌انداز روشن آغاز می‌شود.</p>
          <button
            type="button"
            onClick={onOpenAnnualWizard}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>شروع برنامه‌ریزی سالانه</span>
          </button>
        </div>
      ) : filteredTopLevelGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500 space-y-2">
          <p>در فیلتر انتخاب شده (سال یا دسته‌بندی) هدفی یافت نشد.</p>
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('ALL'); setSelectedYearFilter('ALL'); }}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            مشاهده همه اهداف
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopLevelGoals.map((annual) => {
            const annualProgress = calculateGoalProgress(annual.id);
            const subGoals = getSubGoals(annual.id);
            const directTasks = getTasksForGoal(annual.id);
            const isExpanded = expandedGoals[annual.id] !== false; // default expanded
            const statusInfo = getStatusBadge(annual.status);
            const StatusIcon = statusInfo.icon;
            const annualCat = getCategory(annual.categoryId);
            const isCurrentYear = annual.year === today.year;
            const isFutureYear = annual.year > today.year;
            const yearDiff = annual.year - today.year;
            const isTopLevelSeasonal = annual.period === 'SEASONAL' && annual.seasonIndex !== undefined;
            const topLevelSeasonTheme = isTopLevelSeasonal ? SEASON_CONFIG[annual.seasonIndex!] : null;

            return (
              <div
                key={annual.id}
                className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-4 ${
                  topLevelSeasonTheme
                    ? topLevelSeasonTheme.cardBg
                    : 'bg-white border-emerald-100'
                }`}
              >
                {/* Annual Goal Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Year Indicator */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isCurrentYear
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : isFutureYear
                          ? 'text-indigo-800 bg-indigo-50 border-indigo-200'
                          : 'text-gray-700 bg-gray-100 border-gray-300'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span>سال {toPersianDigits(annual.year)}</span>
                        {isCurrentYear && <span className="text-[10px] text-emerald-600 font-semibold">(امسال)</span>}
                        {isFutureYear && <span className="text-[10px] text-indigo-600 font-semibold">(آینده +{toPersianDigits(yearDiff)})</span>}
                      </span>

                      {/* Seasonal badge if top-level has season */}
                      {isTopLevelSeasonal && topLevelSeasonTheme && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${topLevelSeasonTheme.badgeClass}`}>
                          <span>{topLevelSeasonTheme.icon}</span>
                          <span>فصل {topLevelSeasonTheme.name}</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      {annualCat && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          style={{
                            backgroundColor: `${annualCat.colorHex}15`,
                            color: annualCat.colorHex,
                            borderColor: `${annualCat.colorHex}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: annualCat.colorHex }}
                          />
                          <span>{annualCat.title}</span>
                        </span>
                      )}

                      {annual.plantType && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-md font-medium">
                          <PlantIcon type={annual.plantType} size="xs" />
                          <span>{annual.plantType}</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </span>

                      <span className="text-[10px] text-gray-400">
                        فعال از: {toPersianDigits(annual.startDate || annual.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mt-1.5 flex items-center gap-2">
                      {annual.plantType && <PlantIcon type={annual.plantType} size="sm" />}
                      <span>{annual.title}</span>
                    </h4>

                    {annual.visionWhy && (
                      <div className="mt-1 text-xs text-amber-900 bg-amber-50/60 border border-amber-200/60 px-2.5 py-1 rounded-lg inline-block">
                        <strong>چرا مهم است: </strong>{annual.visionWhy}
                      </div>
                    )}

                    {annual.description && (
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                        {annual.description}
                      </p>
                    )}
                  </div>

                  {/* Actions for Annual Goal */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewHistory(annual)}
                      title="مشاهده تاریخچه و لاگ تغییرات"
                      className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تاریخچه ({toPersianDigits(annual.history?.length || 0)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditGoal(annual)}
                      title="ویرایش هدف"
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteGoal(annual.id)}
                      title="حذف هدف"
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(annual.id)}
                      title={isExpanded ? 'بستن زیرمجموعه‌ها' : 'باز کردن زیرمجموعه‌ها'}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Overall Annual Progress Bar */}
                <div>
                  <div className="flex justify-between items-center text-xs text-emerald-900/80 mb-1 font-medium">
                    <span>پیشرفت کلی هدف سالانه و مراحل میانی</span>
                    <span className="font-bold text-emerald-700">{toPersianDigits(annualProgress)}٪</span>
                  </div>
                  <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${annualProgress}%` }}
                    />
                  </div>
                </div>

                {/* Sub-goals and Micro-tasks Cascade */}
                {isExpanded && (
                  <div className="pt-3 border-t border-gray-100 space-y-4">
                    {/* Add Intermediate Goal Action Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>اهداف میانی بر اساس این هدف ({toPersianDigits(subGoals.length)})</span>
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNewGoal(annual.id, 'SEASONAL')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ گام میانی فصلی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNewGoal(annual.id, 'MONTHLY')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ گام میانی ماهانه</span>
                        </button>
                      </div>
                    </div>

                    {/* Intermediate Goals List */}
                    {subGoals.length === 0 ? (
                      <div className="bg-gray-50/70 rounded-xl p-3 text-center text-xs text-gray-500 border border-dashed border-gray-200">
                        هنوز هدف میانی برای این هدف سالانه تعریف نشده است. با افزودن اهداف فصلی یا ماهانه، مسیر پیشرفت را به بخش‌های قابل مدیریت تقسیم کنید.
                      </div>
                    ) : (
                      <div className="space-y-3 pr-2 border-r-2 border-emerald-200">
                        {subGoals.map((sub) => {
                          const subProgress = calculateGoalProgress(sub.id);
                          const subTasks = getTasksForGoal(sub.id);
                          const subStatus = getStatusBadge(sub.status);
                          const SubStatusIcon = subStatus.icon;
                          const isSeasonal = sub.period === 'SEASONAL' && sub.seasonIndex !== undefined;
                          const seasonTheme = isSeasonal ? SEASON_CONFIG[sub.seasonIndex!] : null;
                          const subCardClass = seasonTheme
                            ? seasonTheme.cardBg
                            : sub.period === 'MONTHLY'
                            ? 'bg-teal-50/70 border-teal-200 border-r-4 border-r-teal-500 shadow-xs shadow-teal-100'
                            : 'bg-emerald-50/40 border-emerald-100/90';
                          const subProgressBarClass = seasonTheme
                            ? seasonTheme.progressBar
                            : sub.period === 'MONTHLY'
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-600'
                            : 'bg-emerald-600';

                          return (
                            <div
                              key={sub.id}
                              className={`rounded-xl border p-3.5 space-y-3 transition-all ${subCardClass}`}
                            >
                              {/* Intermediate Goal Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {sub.period === 'SEASONAL' && sub.seasonIndex !== undefined && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${SEASON_CONFIG[sub.seasonIndex]?.badgeClass || 'bg-white border-emerald-200'}`}>
                                        <span>{SEASON_CONFIG[sub.seasonIndex]?.icon}</span>
                                        <span>فصل {SEASON_CONFIG[sub.seasonIndex]?.name}</span>
                                      </span>
                                    )}
                                    {sub.period === 'MONTHLY' && sub.monthIndex !== undefined && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 border border-teal-300 text-teal-900 flex items-center gap-1">
                                        <span>📅</span>
                                        <span>ماه {PERSIAN_MONTHS[sub.monthIndex - 1]}</span>
                                      </span>
                                    )}
                                    {sub.categoryId && getCategory(sub.categoryId) && (
                                      <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                                        style={{
                                          backgroundColor: `${getCategory(sub.categoryId)!.colorHex}15`,
                                          color: getCategory(sub.categoryId)!.colorHex,
                                          borderColor: `${getCategory(sub.categoryId)!.colorHex}40`,
                                        }}
                                      >
                                        <span
                                          className="w-1.5 h-1.5 rounded-full"
                                          style={{ backgroundColor: getCategory(sub.categoryId)!.colorHex }}
                                        />
                                        <span>{getCategory(sub.categoryId)!.title}</span>
                                      </span>
                                    )}
                                    {sub.plantType && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-900 bg-white/90 border border-emerald-200/70 px-1.5 py-0.2 rounded-md font-medium">
                                        <PlantIcon type={sub.plantType} size="xs" />
                                        <span>{sub.plantType}</span>
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${subStatus.color}`}>
                                      <SubStatusIcon className="w-2.5 h-2.5" />
                                      <span>{subStatus.label}</span>
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                                    {sub.plantType && <PlantIcon type={sub.plantType} size="xs" />}
                                    <span>{sub.title}</span>
                                  </h5>
                                  {sub.description && (
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                      {sub.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onViewHistory(sub)}
                                    title="مشاهده تاریخچه"
                                    className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                                  >
                                    <History className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onEditGoal(sub)}
                                    title="ویرایش این هدف"
                                    className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteGoal(sub.id)}
                                    title="حذف این هدف"
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Intermediate Goal Progress Bar */}
                              <div>
                                <div className="flex justify-between items-center text-[11px] text-gray-600 mb-1">
                                  <span>پیشرفت این گام میانی</span>
                                  <span className="font-bold text-emerald-700">{toPersianDigits(subProgress)}٪</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/90 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${subProgressBarClass} rounded-full transition-all`}
                                    style={{ width: `${subProgress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Micro-tasks for this intermediate goal (Weekly & Daily) */}
                              <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>تسک‌های ریزتر هفتگی و روزانه ({toPersianDigits(subTasks.length)})</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => onNewTaskForGoal(sub.id)}
                                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>افزودن تسک خرد</span>
                                  </button>
                                </div>

                                {subTasks.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 py-1 text-center">
                                    تسک هفتگی یا روزانه‌ای ثبت نشده است. روی «افزودن تسک خرد» کلیک کنید.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {subTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                                          task.isCompleted
                                            ? 'bg-gray-50 border-gray-200 opacity-60'
                                            : 'bg-white border-emerald-100 shadow-2xs'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <button
                                            type="button"
                                            onClick={() => onToggleTask(task.id)}
                                            className="cursor-pointer text-emerald-600 hover:text-emerald-700 shrink-0"
                                          >
                                            {task.isCompleted ? (
                                              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                                            ) : (
                                              <Circle className="w-4 h-4 text-gray-300" />
                                            )}
                                          </button>
                                          <div className="min-w-0">
                                            <span className={`block truncate ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>
                                              {task.title}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                              {task.weekOfMonth && (
                                                <span className="text-emerald-700 font-medium bg-emerald-50 px-1 rounded">
                                                  {WEEKS_OF_MONTH[task.weekOfMonth - 1] || `هفته ${toPersianDigits(task.weekOfMonth)}`}
                                                </span>
                                              )}
                                              {task.dayOfWeek !== undefined && (
                                                <span className="text-gray-500">
                                                  {WEEKDAYS[task.dayOfWeek]}
                                                </span>
                                              )}
                                              <span>موعد: {toPersianDigits(task.dueDate)}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {!task.isCompleted && (
                                          <button
                                            type="button"
                                            onClick={() => onOpenTimer(task.title, Math.floor(task.timerSecondsTarget / 60) || 25, () => onToggleTask(task.id))}
                                            title="تمرکز روی این تسک خرد"
                                            className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md shrink-0 cursor-pointer"
                                          >
                                            <Play className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
