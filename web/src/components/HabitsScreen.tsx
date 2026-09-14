import React from 'react';
import { Habit, Category, Goal } from '../types';
import { HabitContributionGrid } from './HabitContributionGrid';
import { toPersianDigits, getTodayJalali, jalaliToFormattedString, WEEKDAYS_SHORT } from '../calendar/jalali';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Clock, 
  ShieldCheck, 
  CalendarOff,
  Flame,
  CheckCircle2,
  Sprout,
  Target
} from 'lucide-react';
import { PlantIcon } from './PlantIcon';

interface Props {
  habits: Habit[];
  categories: Category[];
  goals: Goal[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onNewHabit: () => void;
  onOpenTimer: (title: string, minutes: number, onDone: () => void) => void;
}

export const HabitsScreen: React.FC<Props> = ({
  habits,
  categories,
  goals,
  onToggleHabitDate,
  onDeleteHabit,
  onEditHabit,
  onNewHabit,
  onOpenTimer,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);

  const getCategory = (catId: string) => categories.find(c => c.id === catId);
  const getGoal = (goalId?: string | null) => goals.find(g => g.id === goalId);

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">عادت‌ها و پیوستگی</h2>
          <p className="text-xs text-gray-500 mt-0.5">ثبت زنجیره روزانه، ماتریس ۲۸ روزه و رشد گیاه همراه</p>
        </div>
        <button
          type="button"
          onClick={onNewHabit}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-xs text-gray-400 space-y-2">
          <p>هیچ عادتی ثبت نشده است. ساخت عادت‌های کوچک، زندگی را متحول می‌کند.</p>
          <button
            type="button"
            onClick={onNewHabit}
            className="text-emerald-700 font-bold hover:underline"
          >
            ایجاد اولین عادت
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((h) => {
            const cat = getCategory(h.categoryId);
            const goal = getGoal(h.goalId);
            const isDoneToday = !!h.completionHistory[todayStr];

            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <PlantIcon type={h.plantType} size="sm" />
                      <h3 className="text-sm font-bold text-gray-900 truncate">{h.title}</h3>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>{h.plantType}</span>
                      </span>
                    </div>

                    {h.notes && (
                      <p className="text-xs text-gray-500 mt-1">{h.notes}</p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
                      {cat && (
                        <span
                          className="px-2 py-0.5 rounded-md font-medium text-[10px]"
                          style={{ backgroundColor: `${cat.colorHex}15`, color: cat.colorHex }}
                        >
                          {cat.title}
                        </span>
                      )}

                      {h.timerMinutes > 0 && (
                        <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>تمرکز: {toPersianDigits(h.timerMinutes)} دقیقه</span>
                        </span>
                      )}

                      {h.exemptHolidays && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>معاف در تعطیلات</span>
                        </span>
                      )}

                      {h.exemptWeekends && (
                        <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md text-[10px]">
                          <CalendarOff className="w-3 h-3" />
                          <span>معاف در آخر هفته</span>
                        </span>
                      )}

                      {goal && (
                        <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md text-[10px]">
                          <Target className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{goal.title}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleHabitDate(h.id, todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isDoneToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {isDoneToday ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>انجام شد</span>
                        </>
                      ) : (
                        <span>ثبت امروز</span>
                      )}
                    </button>

                    {h.timerMinutes > 0 && (
                      <button
                        type="button"
                        onClick={() => onOpenTimer(h.title, h.timerMinutes, () => onToggleHabitDate(h.id, todayStr))}
                        title="شروع تمرکز"
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditHabit(h)}
                      title="ویرایش"
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteHabit(h.id)}
                      title="حذف"
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 28-day visual contribution grid */}
                <HabitContributionGrid
                  habit={h}
                  onToggleDate={(dateStr) => onToggleHabitDate(h.id, dateStr)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
