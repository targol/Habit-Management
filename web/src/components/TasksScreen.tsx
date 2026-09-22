import React, { useState } from 'react';
import { AppTask, Category, Goal } from '../types';
import { 
  getTodayJalali, 
  getDayOfWeek,
  toPersianDigits, 
  jalaliToFormattedString, 
  parseJalaliString,
  WEEKDAYS,
  WEEKS_OF_MONTH,
  addDaysJalali
} from '../calendar/jalali';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  Play, 
  Trash2, 
  Edit3, 
  Repeat, 
  Search, 
  Bell, 
  Target,
  AlertCircle,
  Archive,
  RotateCcw,
  Copy
} from 'lucide-react';
import { EntityBadge, EntityIcon } from './EntityIcon';
import { SeasonBadge } from './SeasonBadge';
import { TransferTaskModal } from './TransferTaskModal';

interface Props {
  tasks: AppTask[];
  categories: Category[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: AppTask) => void;
  onNewTask: () => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
  onTransferTask?: (taskId: string, targetGoalId: string | null, closeTask: boolean, noteAppend?: string) => void;
  onCreateSeasonalGoalAndTransfer?: (
    taskId: string, 
    seasonIdx: number, 
    year: number, 
    title: string,
    parentAnnualId?: string | null, 
    categoryId?: string
  ) => void;
  onArchiveTask?: (taskId: string) => void;
  onRestoreTask?: (taskId: string) => void;
  onClearArchivedTasks?: (taskIds?: string[]) => void;
  onDuplicateTask?: (task: AppTask) => void;
}

type FilterTab = 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'RECURRING' | 'COMPLETED' | 'ALL' | 'ARCHIVE';

export const TasksScreen: React.FC<Props> = ({
  tasks,
  categories,
  goals,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onNewTask,
  onOpenTimer,
  onTransferTask,
  onCreateSeasonalGoalAndTransfer,
  onArchiveTask,
  onRestoreTask,
  onClearArchivedTasks,
  onDuplicateTask,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const currentDayOfWeek = getDayOfWeek(today);
  const oneMonthAgoDate = addDaysJalali(today, -30);
  const oneMonthAgoStr = jalaliToFormattedString(oneMonthAgoDate);

  const [activeTab, setActiveTab] = useState<FilterTab>('TODAY');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskToTransfer, setTaskToTransfer] = useState<AppTask | null>(null);

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  const getGoal = (goalId?: string | null) => goals.find(g => g.id === goalId);

  // Automatic archive rule: Completed tasks older than 1 month (30 days)
  const isTaskArchived = (t: AppTask): boolean => {
    if (t.isArchived === true) return true;
    if (t.isArchived === false) return false;
    if (t.isCompleted) {
      const doneDate = t.completedAt || t.dueDate;
      if (doneDate && doneDate < oneMonthAgoStr) {
        return true;
      }
    }
    return false;
  };

  // Split tasks into active (current) and archived
  const activeTasks = tasks.filter(t => !isTaskArchived(t));
  const archivedTasks = tasks.filter(t => isTaskArchived(t));

  // Counts for each tab
  const todayCount = activeTasks.filter(t => {
    if (t.isCompleted) return false;
    if (t.dueDate === todayStr) return true;
    if (t.repeatType === 'DAILY') return true;
    if (t.repeatType === 'WEEKLY' && Array.isArray(t.repeatDaysOfWeek) && t.repeatDaysOfWeek.includes(currentDayOfWeek)) return true;
    if (!t.dueDate) return true; // Undated pending tasks also need attention
    if (t.dueDate < todayStr) return true; // Overdue tasks should show in today's radar
    return false;
  }).length;

  const overdueCount = activeTasks.filter(t => !t.isCompleted && Boolean(t.dueDate && t.dueDate < todayStr)).length;
  const upcomingCount = activeTasks.filter(t => !t.isCompleted && Boolean(t.dueDate && t.dueDate > todayStr)).length;
  const recurringCount = activeTasks.filter(t => t.repeatType && t.repeatType !== 'NONE').length;
  const completedCount = activeTasks.filter(t => t.isCompleted).length;
  const allCount = activeTasks.length;
  const archivedCount = archivedTasks.length;

  // Active pool depends on selected tab
  const sourcePool = activeTab === 'ARCHIVE' ? archivedTasks : activeTasks;

  // Filter tasks based on tab, category, and search
  const filteredTasks = sourcePool.filter(t => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    // Category
    if (selectedCatId && t.categoryId !== selectedCatId) {
      return false;
    }

    const isOverdue = Boolean(t.dueDate && t.dueDate < todayStr && !t.isCompleted);
    const isTodayScheduled = t.dueDate === todayStr || 
      t.repeatType === 'DAILY' || 
      (t.repeatType === 'WEEKLY' && Array.isArray(t.repeatDaysOfWeek) && t.repeatDaysOfWeek.includes(currentDayOfWeek)) ||
      (!t.dueDate && !t.isCompleted);

    // Tab
    switch (activeTab) {
      case 'TODAY':
        return isTodayScheduled || isOverdue;
      case 'OVERDUE':
        return isOverdue;
      case 'UPCOMING':
        return Boolean(t.dueDate && t.dueDate > todayStr && !t.isCompleted);
      case 'RECURRING':
        return t.repeatType !== 'NONE';
      case 'COMPLETED':
        return t.isCompleted;
      case 'ARCHIVE':
      case 'ALL':
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Sticky Header & Filters */}
      <div className="sticky -top-5 z-20 pt-5 pb-2.5 bg-[#F8F9F5]/95 backdrop-blur-md space-y-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Header & Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">مدیریت تسک‌ها</h2>
            <p className="text-xs text-gray-500 mt-0.5">برنامه‌ریزی، اولویت‌بندی و بایگانی هوشمند وظایف</p>
          </div>
          <button
            type="button"
            onClick={onNewTask}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسک جدید</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="جستجو در تسک‌ها و یادداشت‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all shadow-2xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold overflow-x-auto shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('TODAY')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'TODAY' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>امروز</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'TODAY' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {toPersianDigits(todayCount)}
            </span>
          </button>

          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('OVERDUE')}
              className={`py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 whitespace-nowrap ${
                activeTab === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>معوقه</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'OVERDUE' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-800'
              }`}>
                {toPersianDigits(overdueCount)}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('UPCOMING')}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'UPCOMING' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>آتی</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {toPersianDigits(upcomingCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RECURRING')}
            className={`flex-1 min-w-[85px] py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'RECURRING' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>تکرارشونده</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'RECURRING' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {toPersianDigits(recurringCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'COMPLETED' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>تکمیل‌شده</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {toPersianDigits(completedCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 min-w-[65px] py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'ALL' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>همه</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {toPersianDigits(allCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVE')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ARCHIVE' 
                ? 'bg-amber-700 text-white shadow-xs' 
                : 'text-gray-600 hover:text-amber-800 hover:bg-amber-50/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>بایگانی</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'ARCHIVE' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {toPersianDigits(archivedCount)}
            </span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCatId === null 
                ? 'bg-emerald-800 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            همه دسته‌ها ({toPersianDigits(sourcePool.length)})
          </button>
          {categories.map((c) => {
            const count = sourcePool.filter(t => t.categoryId === c.id).length;
            const isSel = selectedCatId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCatId(isSel ? null : c.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 border ${
                  isSel
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.title} ({toPersianDigits(count)})
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Banner on COMPLETED tab if there are archived tasks */}
      {activeTab === 'COMPLETED' && archivedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">
                {toPersianDigits(archivedCount)} تسک تکمیل‌شده قدیمی به بایگانی منتقل شده‌اند
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                تسک‌های تکمیل‌شده با قدمت بیش از ۱ ماه به صورت خودکار در بخش بایگانی قرار می‌گیرند تا لیست جاری خلوت بماند.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVE')}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>مشاهده بایگانی</span>
          </button>
        </div>
      )}

      {/* Archive Header Banner when on ARCHIVE tab */}
      {activeTab === 'ARCHIVE' && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 border border-amber-200">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <span>بایگانی خودکار تسک‌ها</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold">
                    {toPersianDigits(archivedCount)} تسک
                  </span>
                </h3>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  تسک‌های تکمیل‌شده با قدمت بیش از ۱ ماه به صورت خودکار به اینجا منتقل می‌شوند تا لیست‌های روزانه و فعال خلوت، سریع و متمرکز بمانند.
                </p>
              </div>
            </div>

            {archivedCount > 0 && onClearArchivedTasks && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`آیا از پاکسازی تمام ${toPersianDigits(archivedCount)} تسک موجود در بایگانی اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`)) {
                    onClearArchivedTasks();
                  }
                }}
                className="self-start sm:self-auto px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی کل بایگانی</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
            <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>ملاک انتقال خودکار:</span>
              <strong className="text-amber-950">بیش از ۳۰ روز از تاریخ تکمیل یا موعد</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium">
              <span>تاریخ مبنای بایگانی:</span>
              <strong className="text-amber-950">{toPersianDigits(oneMonthAgoStr)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        activeTab === 'ARCHIVE' ? (
          <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-10 text-center text-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-800 text-sm">هیچ تسکی در بخش بایگانی وجود ندارد</h4>
              <p className="text-gray-500 max-w-sm mx-auto text-[11px] leading-relaxed">
                تسک‌های تکمیل‌شده به محض اینکه ۳۰ روز از اتمام آنها بگذرد، به صورت خودکار به اینجا منتقل خواهند شد تا لیست‌های جاری همواره سبک و بدون شلوغی بمانند.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-400 space-y-2">
            <p>هیچ تسکی با فیلترهای انتخابی یافت نشد.</p>
            <button
              type="button"
              onClick={onNewTask}
              className="text-emerald-700 font-bold hover:underline"
            >
              ایجاد تسک جدید
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const cat = getCategory(t.categoryId);
            const goal = getGoal(t.goalId);
            const isArchived = isTaskArchived(t);

            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isArchived
                    ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/30 to-white hover:border-amber-300'
                    : t.isCompleted 
                    ? 'border-gray-200 bg-gray-50/50 opacity-75' 
                    : 'bg-white border-emerald-100 shadow-xs hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t.id)}
                      title={isArchived ? 'خروج از وضعیت تکمیل و بازگشت به تسک‌های فعال' : 'تغییر وضعیت انجام'}
                      className="cursor-pointer text-emerald-600 hover:text-emerald-700 transition-colors mt-0.5 shrink-0"
                    >
                      {t.isCompleted ? (
                        <CheckCircle2 className={`w-5 h-5 fill-emerald-600 text-white ${isArchived ? 'opacity-85' : ''}`} />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold ${t.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {t.title}
                      </h4>
                      {t.notes && (
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          {t.notes}
                        </p>
                      )}
                      
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
                        <EntityBadge type="TASK" size="xs" />

                        {isArchived && (
                          <span className="px-2 py-0.5 rounded-md font-medium text-[10px] bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Archive className="w-2.5 h-2.5 text-amber-700" />
                            <span>بایگانی خودکار</span>
                          </span>
                        )}

                        {cat && (
                          <span
                            className="px-2 py-0.5 rounded-md font-medium text-[10px]"
                            style={{ backgroundColor: `${cat.colorHex}15`, color: cat.colorHex }}
                          >
                            {cat.title}
                          </span>
                        )}

                        {t.dueDate ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${
                            !t.isCompleted && t.dueDate < todayStr
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : t.dueDate === todayStr
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold'
                              : 'text-gray-600 bg-gray-100'
                          }`}>
                            {!t.isCompleted && t.dueDate < todayStr && <AlertCircle className="w-2.5 h-2.5 text-rose-600" />}
                            <span>
                              {!t.isCompleted && t.dueDate < todayStr ? 'معوقه: ' : 'موعد: '}
                              {toPersianDigits(t.dueDate)}
                              {t.deadlineTime ? ` (${toPersianDigits(t.deadlineTime)})` : ''}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-500 bg-gray-50 border border-dashed border-gray-200 px-2 py-0.5 rounded-md text-[10px]" title="بدون تاریخ موعد معین - مهلت پیش‌فرض: پایان سال">
                            مهلت: پایان سال {toPersianDigits(today.year)}
                          </span>
                        )}

                        {t.completedAt && (
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                            تکمیل: {toPersianDigits(t.completedAt)}
                          </span>
                        )}

                        {t.time && (
                          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md text-[10px]" title="زمان انجام تسک">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>انجام: {toPersianDigits(t.time)}</span>
                          </span>
                        )}

                        {t.reminderMinutesBefore && (
                          <span className="flex items-center gap-1 text-amber-600 text-[10px]">
                            <Bell className="w-3 h-3" />
                            <span>{toPersianDigits(t.reminderMinutesBefore)} دقیقه قبل</span>
                          </span>
                        )}

                        {t.repeatType !== 'NONE' && (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md text-[10px]">
                            <Repeat className="w-3 h-3" />
                            <span>{t.repeatType === 'DAILY' ? 'روزانه' : t.repeatType === 'WEEKLY' ? 'هفتگی' : 'ماهانه'}</span>
                          </span>
                        )}

                        {t.weekOfMonth && (
                          <span className="text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                            {WEEKS_OF_MONTH[t.weekOfMonth - 1] || `هفته ${toPersianDigits(t.weekOfMonth)}`}
                            {t.dayOfWeek !== undefined ? ` - ${WEEKDAYS[t.dayOfWeek]}` : ''}
                          </span>
                        )}

                        {goal && (
                          <span className="inline-flex items-center gap-1">
                            {goal.period === 'SEASONAL' && (
                              <SeasonBadge seasonIndex={goal.seasonIndex} size="xs" />
                            )}
                            <EntityBadge
                              type={goal.period === 'ANNUAL' ? 'ANNUAL_GOAL' : 'INTERMEDIATE_GOAL'}
                              customLabel={goal.period === 'ANNUAL' ? `🎯 ${goal.title}` : goal.title}
                              size="xs"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* If archived, show restore button */}
                    {isArchived && onRestoreTask && (
                      <button
                        type="button"
                        onClick={() => onRestoreTask(t.id)}
                        title="بازگردانی به لیست تسک‌های جاری"
                        className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>بازگردانی</span>
                      </button>
                    )}

                    {/* If completed and not in archive, show manual archive button */}
                    {!isArchived && t.isCompleted && onArchiveTask && (
                      <button
                        type="button"
                        onClick={() => onArchiveTask(t.id)}
                        title="انتقال به بایگانی"
                        className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => setTaskToTransfer(t)}
                        title="انتقال یا بستن تسک (فصلی / سالانه)"
                        className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!t.isCompleted && (
                      <button
                        type="button"
                        onClick={() => onOpenTimer(t.title, Math.floor(t.timerSecondsTarget / 60) || 25, () => onToggleTask(t.id))}
                        title="شروع تمرکز"
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDuplicateTask && (
                      <button
                        type="button"
                        onClick={() => onDuplicateTask(t)}
                        title="کپی گرفتن و ویرایش تسک (داپلیکیت)"
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditTask(t)}
                      title="ویرایش"
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(t.id)}
                      title={isArchived ? "حذف دائمی از بایگانی" : "حذف"}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfer or Close Single Task Modal */}
      <TransferTaskModal
        isOpen={Boolean(taskToTransfer)}
        task={taskToTransfer}
        goals={goals}
        categories={categories}
        onClose={() => setTaskToTransfer(null)}
        onTransfer={(taskId, targetGoalId, closeTask, noteAppend) => {
          if (onTransferTask) {
            onTransferTask(taskId, targetGoalId, closeTask, noteAppend);
          }
          setTaskToTransfer(null);
        }}
        onCreateSeasonalGoalAndTransfer={(taskId, seasonIdx, year, title, parentAnnualId, categoryId) => {
          if (onCreateSeasonalGoalAndTransfer) {
            onCreateSeasonalGoalAndTransfer(taskId, seasonIdx, year, title, parentAnnualId, categoryId);
          }
          setTaskToTransfer(null);
        }}
      />
    </div>
  );
};
