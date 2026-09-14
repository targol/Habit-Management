import React, { useState, useEffect } from 'react';
import { AppTask, Category, Goal } from '../types';
import { getTodayJalali, jalaliToFormattedString, toPersianDigits, PERSIAN_MONTHS, addDaysJalali } from '../calendar/jalali';
import { X, Calendar, Clock, Bell, Repeat, Folder, Target } from 'lucide-react';

interface Props {
  isOpen: boolean;
  task?: AppTask | null;
  categories: Category[];
  goals: Goal[];
  onClose: () => void;
  onSave: (task: AppTask) => void;
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  task,
  categories,
  goals,
  onClose,
  onSave,
}) => {
  const today = getTodayJalali();
  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  
  // Inherit category from linked goal if available
  const initialGoal = goals.find(g => g.id === task?.goalId);
  const [categoryId, setCategoryId] = useState(
    task?.categoryId || initialGoal?.categoryId || categories[0]?.id || 'cat-work'
  );
  const [goalId, setGoalId] = useState<string | null>(task?.goalId || null);
  const [isInheritedFromGoal, setIsInheritedFromGoal] = useState(Boolean(initialGoal?.categoryId));

  // Due date state
  const initialDate = task ? task.dueDate : jalaliToFormattedString(today);
  const [dateParts, setDateParts] = useState(() => {
    const p = initialDate.split('/').map(v => parseInt(v, 10));
    return { year: p[0] || today.year, month: p[1] || today.month, day: p[2] || today.day };
  });

  const [time, setTime] = useState(task?.time || '10:00');
  const [hasTime, setHasTime] = useState(!!task?.time);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(task?.reminderMinutesBefore ?? null);
  const [repeatType, setRepeatType] = useState<AppTask['repeatType']>(task?.repeatType || 'NONE');
  const [timerMinutes, setTimerMinutes] = useState(task ? Math.floor(task.timerSecondsTarget / 60) : 25);
  const [weekOfMonth, setWeekOfMonth] = useState<number | undefined>(task?.weekOfMonth ?? 1);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(task?.dayOfWeek ?? (today.day % 7));

  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setTitle(task.title || '');
      setNotes(task.notes || '');
      const linkedGoal = goals.find(g => g.id === task.goalId);
      setCategoryId(task.categoryId || linkedGoal?.categoryId || categories[0]?.id || 'cat-work');
      setGoalId(task.goalId || null);
      setIsInheritedFromGoal(Boolean(task.goalId));
      
      const p = (task.dueDate || jalaliToFormattedString(today)).split('/').map(v => parseInt(v, 10));
      setDateParts({ year: p[0] || today.year, month: p[1] || today.month, day: p[2] || today.day });
      setTime(task.time || '10:00');
      setHasTime(Boolean(task.time));
      setReminderMinutes(task.reminderMinutesBefore ?? null);
      setRepeatType(task.repeatType || 'NONE');
      setTimerMinutes(Math.floor((task.timerSecondsTarget || 1500) / 60));
      setWeekOfMonth(task.weekOfMonth ?? 1);
      setDayOfWeek(task.dayOfWeek ?? (today.day % 7));
    } else {
      setTitle('');
      setNotes('');
      setCategoryId(categories[0]?.id || 'cat-work');
      setGoalId(null);
      setIsInheritedFromGoal(false);
      setDateParts({ year: today.year, month: today.month, day: today.day });
      setTime('10:00');
      setHasTime(false);
      setReminderMinutes(null);
      setRepeatType('NONE');
      setTimerMinutes(25);
      setWeekOfMonth(1);
      setDayOfWeek(today.day % 7);
    }
  }, [isOpen, task, categories, goals]);

  if (!isOpen) return null;

  const handleGoalChange = (newGoalId: string | null) => {
    setGoalId(newGoalId);
    if (newGoalId) {
      const g = goals.find(item => item.id === newGoalId);
      if (g?.categoryId) {
        setCategoryId(g.categoryId);
        setIsInheritedFromGoal(true);
      }
    } else {
      setIsInheritedFromGoal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDateStr = `${dateParts.year}/${dateParts.month.toString().padStart(2, '0')}/${dateParts.day.toString().padStart(2, '0')}`;

    const newTask: AppTask = {
      id: task ? task.id : `task-${Date.now()}`,
      title: title.trim(),
      notes: notes.trim(),
      categoryId,
      goalId: goalId || null,
      dueDate: dueDateStr,
      time: hasTime ? time : null,
      reminderMinutesBefore: reminderMinutes,
      repeatType,
      repeatDaysOfWeek: repeatType === 'DAILY' ? [0, 1, 2, 3, 4, 5, 6] : [dayOfWeek ?? (today.day % 7)],
      weekOfMonth,
      dayOfWeek,
      timerSecondsTarget: timerMinutes * 60,
      timerSecondsElapsed: task?.timerSecondsElapsed || 0,
      isCompleted: task?.isCompleted || false,
      completedAt: task?.completedAt || null,
    };

    onSave(newTask);
    onClose();
  };

  const handleQuickDate = (offsetDays: number) => {
    const target = addDaysJalali(today, offsetDays);
    setDateParts({ year: target.year, month: target.month, day: target.day });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-emerald-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {task ? 'ویرایش تسک' : 'افزودن تسک جدید'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">عنوان وظیفه *</label>
            <input
              type="text"
              required
              placeholder="مثلاً: مرور اهداف فصلی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">توضیحات و یادداشت</label>
            <textarea
              rows={2}
              placeholder="جزئیات، لینک‌ها یا نکات مهم..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Category & Goal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-emerald-600" />
                  <span>دسته‌بندی</span>
                </span>
                {isInheritedFromGoal && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded-sm">ارث‌بری از هدف</span>
                )}
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setIsInheritedFromGoal(false);
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>اتصال به هدف</span>
              </label>
              <select
                value={goalId || ''}
                onChange={(e) => handleGoalChange(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-hidden"
              >
                <option value="">بدون هدف (مستقل)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.period === 'ANNUAL' ? '🎯 سالانه: ' : g.period === 'SEASONAL' ? '🍂 فصلی: ' : '📅 ماهانه: '}
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Week and Day micro-scheduling */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">هفته ماه (برای تسک‌های خرد)</label>
              <select
                value={weekOfMonth ?? 1}
                onChange={(e) => setWeekOfMonth(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
              >
                <option value={1}>هفته اول</option>
                <option value={2}>هفته دوم</option>
                <option value={3}>هفته سوم</option>
                <option value={4}>هفته چهارم</option>
                <option value={5}>هفته پنجم</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">روز مشخص هفته</label>
              <select
                value={dayOfWeek ?? 0}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
              >
                <option value={0}>شنبه</option>
                <option value={1}>یکشنبه</option>
                <option value={2}>دوشنبه</option>
                <option value={3}>سه‌شنبه</option>
                <option value={4}>چهارشنبه</option>
                <option value={5}>پنج‌شنبه</option>
                <option value={6}>جمعه</option>
              </select>
            </div>
          </div>

          {/* Persian Date Picker Section */}
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>تاریخ موعد (تقویم شمسی)</span>
              </span>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded-md hover:bg-emerald-100"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded-md hover:bg-emerald-100"
                >
                  فردا
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <select
                value={dateParts.day}
                onChange={(e) => setDateParts({ ...dateParts, day: parseInt(e.target.value, 10) })}
                className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>روز {toPersianDigits(d)}</option>
                ))}
              </select>

              <select
                value={dateParts.month}
                onChange={(e) => setDateParts({ ...dateParts, month: parseInt(e.target.value, 10) })}
                className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-white"
              >
                {PERSIAN_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                value={dateParts.year}
                onChange={(e) => setDateParts({ ...dateParts, year: parseInt(e.target.value, 10) })}
                className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-white"
              >
                {[today.year, today.year + 1].map((y) => (
                  <option key={y} value={y}>{toPersianDigits(y)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ساعت مشخص</span>
                </label>
                <input
                  type="checkbox"
                  checked={hasTime}
                  onChange={(e) => setHasTime(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <input
                type="time"
                disabled={!hasTime}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs ${!hasTime ? 'bg-gray-100 opacity-50' : 'bg-white'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>یادآوری قبل از موعد</span>
              </label>
              <select
                value={reminderMinutes === null ? '' : reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white"
              >
                <option value="">بدون یادآوری</option>
                <option value="10">۱۰ دقیقه قبل</option>
                <option value="15">۱۵ دقیقه قبل</option>
                <option value="30">۳۰ دقیقه قبل</option>
                <option value="60">۱ ساعت قبل</option>
              </select>
            </div>
          </div>

          {/* Repeat & Focus timer target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                <span>تکرار</span>
              </label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as AppTask['repeatType'])}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white"
              >
                <option value="NONE">بدون تکرار</option>
                <option value="DAILY">هر روز</option>
                <option value="WEEKLY">هفتگی</option>
                <option value="MONTHLY">ماهانه</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>هدف تمرکز (دقیقه)</span>
              </label>
              <input
                type="number"
                min="0"
                max="240"
                step="5"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
            >
              ذخیره تسک
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
