import React, { useState } from 'react';
import { AppTask, Category, Goal } from '../types';
import { 
  getTodayJalali, 
  toPersianDigits, 
  jalaliToFormattedString, 
  parseJalaliString,
  WEEKDAYS,
  WEEKS_OF_MONTH
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
  Target
} from 'lucide-react';
import { EntityBadge, EntityIcon } from './EntityIcon';

interface Props {
  tasks: AppTask[];
  categories: Category[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: AppTask) => void;
  onNewTask: () => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
}

type FilterTab = 'TODAY' | 'UPCOMING' | 'RECURRING' | 'COMPLETED' | 'ALL';

export const TasksScreen: React.FC<Props> = ({
  tasks,
  categories,
  goals,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onNewTask,
  onOpenTimer,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);

  const [activeTab, setActiveTab] = useState<FilterTab>('TODAY');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  const getGoal = (goalId?: string | null) => goals.find(g => g.id === goalId);

  // Filter tasks based on tab, category, and search
  const filteredTasks = tasks.filter(t => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.notes.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Category
    if (selectedCatId && t.categoryId !== selectedCatId) {
      return false;
    }

    // Tab
    switch (activeTab) {
      case 'TODAY':
        return t.dueDate === todayStr || t.repeatType === 'DAILY' || (t.repeatType === 'WEEKLY' && t.repeatDaysOfWeek.includes(today.day % 7));
      case 'UPCOMING': {
        const d = parseJalaliString(t.dueDate);
        if (!d) return false;
        return t.dueDate > todayStr && !t.isCompleted;
      }
      case 'RECURRING':
        return t.repeatType !== 'NONE';
      case 'COMPLETED':
        return t.isCompleted;
      case 'ALL':
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">مدیریت تسک‌ها</h2>
          <p className="text-xs text-gray-500 mt-0.5">برنامه‌ریزی، اولویت‌بندی و پیگیری وظایف</p>
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
          className="w-full pr-10 pl-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('TODAY')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'TODAY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
        >
          امروز
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UPCOMING')}
          className={`flex-1 min-w-[70px] py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'UPCOMING' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
        >
          آتی
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RECURRING')}
          className={`flex-1 min-w-[85px] py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'RECURRING' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
        >
          تکرارشونده
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex-1 min-w-[75px] py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
        >
          تکمیل‌شده
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 min-w-[60px] py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'ALL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
        >
          همه
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCatId(null)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            selectedCatId === null 
              ? 'bg-emerald-800 text-white' 
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          همه دسته‌ها ({toPersianDigits(tasks.length)})
        </button>
        {categories.map((c) => {
          const count = tasks.filter(t => t.categoryId === c.id).length;
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

      {/* Task List */}
      {filteredTasks.length === 0 ? (
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
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const cat = getCategory(t.categoryId);
            const goal = getGoal(t.goalId);
            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${
                  t.isCompleted 
                    ? 'border-gray-200 bg-gray-50/50 opacity-70' 
                    : 'border-emerald-100 shadow-xs hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t.id)}
                      className="cursor-pointer text-emerald-600 hover:text-emerald-700 transition-colors mt-0.5 shrink-0"
                    >
                      {t.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
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

                        {cat && (
                          <span
                            className="px-2 py-0.5 rounded-md font-medium text-[10px]"
                            style={{ backgroundColor: `${cat.colorHex}15`, color: cat.colorHex }}
                          >
                            {cat.title}
                          </span>
                        )}

                        <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md text-[10px]">
                          موعد: {toPersianDigits(t.dueDate)}
                        </span>

                        {t.time && (
                          <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{toPersianDigits(t.time)}</span>
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
                          <EntityBadge
                            type={goal.period === 'ANNUAL' ? 'ANNUAL_GOAL' : 'INTERMEDIATE_GOAL'}
                            customLabel={goal.title}
                            size="xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
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
                      title="حذف"
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
    </div>
  );
};
