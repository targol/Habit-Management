import React, { useState } from 'react';
import { Habit, Category, Goal } from '../types';
import { getTodayJalali, jalaliToFormattedString, WEEKDAYS_SHORT } from '../calendar/jalali';
import { X, Folder, Target, Clock, ShieldCheck, Sprout } from 'lucide-react';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';

interface Props {
  isOpen: boolean;
  habit?: Habit | null;
  categories: Category[];
  goals: Goal[];
  onClose: () => void;
  onSave: (habit: Habit) => void;
}

export const HabitModal: React.FC<Props> = ({
  isOpen,
  habit,
  categories,
  goals,
  onClose,
  onSave,
}) => {
  const today = getTodayJalali();
  const [title, setTitle] = useState(habit?.title || '');
  const [notes, setNotes] = useState(habit?.notes || '');

  // Inherit from goal if available
  const initialGoal = goals.find(g => g.id === habit?.goalId);
  const [categoryId, setCategoryId] = useState(
    habit?.categoryId || initialGoal?.categoryId || categories[0]?.id || 'cat-health'
  );
  const [goalId, setGoalId] = useState<string | null>(habit?.goalId || null);
  const [timerMinutes, setTimerMinutes] = useState(habit?.timerMinutes || 15);
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDaysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
  const [exemptHolidays, setExemptHolidays] = useState(habit?.exemptHolidays || false);
  const [exemptWeekends, setExemptWeekends] = useState(habit?.exemptWeekends || false);
  const [plantType, setPlantType] = useState(
    habit?.plantType || initialGoal?.plantType || categories.find(c => c.id === (habit?.categoryId || initialGoal?.categoryId))?.plantType || ALL_PLANT_TYPES[0].id
  );
  const [isInheritedFromGoal, setIsInheritedFromGoal] = useState(Boolean(initialGoal));

  if (!isOpen) return null;

  const handleGoalChange = (newGoalId: string | null) => {
    setGoalId(newGoalId);
    if (newGoalId) {
      const g = goals.find(item => item.id === newGoalId);
      if (g) {
        if (g.categoryId) setCategoryId(g.categoryId);
        if (g.plantType) setPlantType(g.plantType);
        setIsInheritedFromGoal(true);
      }
    } else {
      setIsInheritedFromGoal(false);
    }
  };

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const catObj = categories.find(c => c.id === newCatId);
    if (catObj?.plantType) {
      setPlantType(catObj.plantType);
    }
  };

  const toggleDay = (dayIdx: number) => {
    if (targetDays.includes(dayIdx)) {
      if (targetDays.length === 1) return; // at least 1 day
      setTargetDays(targetDays.filter(d => d !== dayIdx));
    } else {
      setTargetDays([...targetDays, dayIdx].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHabit: Habit = {
      id: habit ? habit.id : `habit-${Date.now()}`,
      title: title.trim(),
      notes: notes.trim(),
      categoryId,
      goalId: goalId || null,
      time: habit?.time || '08:00',
      timerMinutes,
      frequency: targetDays.length === 7 ? 'DAILY' : 'WEEKLY',
      targetDaysOfWeek: targetDays,
      exemptHolidays,
      exemptWeekends,
      plantType,
      completionHistory: habit?.completionHistory || {},
      createdAt: habit ? habit.createdAt : jalaliToFormattedString(today),
    };

    onSave(newHabit);
    onClose();
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
          {habit ? 'ویرایش عادت' : 'تعریف عادت جدید'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">عنوان عادت *</label>
            <input
              type="text"
              required
              placeholder="مثلاً: مطالعه کتاب روزانه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">توضیحات و انگیزه</label>
            <textarea
              rows={2}
              placeholder="دلیل و روش انجام این عادت..."
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
                onChange={(e) => handleCategoryChange(e.target.value)}
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
                <span>متصل به هدف</span>
              </label>
              <select
                value={goalId || ''}
                onChange={(e) => handleGoalChange(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-hidden"
              >
                <option value="">بدون هدف (مستقل)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.period === 'ANNUAL' ? '🎯 ' : g.period === 'SEASONAL' ? '🍂 ' : '📅 '}
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plant Symbol & Focus Timer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>انتخاب گیاه همراه باغچه</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-700">با هر روز استمرار رشد می‌کند</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 bg-emerald-50/30 rounded-xl border border-emerald-100">
              {ALL_PLANT_TYPES.map((p) => {
                const isSelected = plantType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlantType(p.id)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white text-gray-700 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <PlantIcon type={p.id} size="md" />
                    <span className="text-[10px] font-bold truncate w-full">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>زمان تمرکز روزانه (دقیقه - در صورت نیاز به تایمر)</span>
            </label>
            <input
              type="number"
              min="0"
              max="120"
              step="5"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
              placeholder="مثلاً ۱۵ یا ۲۵ دقیقه"
            />
          </div>

          {/* Frequency & Days of week */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">تناوب تکرار</label>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setTargetDays([0, 1, 2, 3, 4, 5, 6])}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    targetDays.length === 7
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  روزانه (هر روز)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetDays.length === 7) {
                      setTargetDays([0, 2, 4]); // default to Sat, Mon, Wed
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    targetDays.length < 7
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  روزهای مشخص هفته
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mt-2">
              {WEEKDAYS_SHORT.map((wName, idx) => {
                const isSelected = targetDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {wName}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {targetDays.length === 7 ? 'این عادت هر روز هفته تکرار می‌شود.' : `این عادت در ${targetDays.length} روز از هفته تکرار می‌شود.`}
            </p>
          </div>

          {/* Exemption rules */}
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/80 space-y-2.5">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>قوانین استراحت و تعطیلات</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={exemptHolidays}
                onChange={(e) => setExemptHolidays(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>معافیت در تعطیلات رسمی تقویم شمسی (بدون شکستن زنجیره)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={exemptWeekends}
                onChange={(e) => setExemptWeekends(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>معافیت در آخر هفته (پنج‌شنبه و جمعه)</span>
            </label>
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
              ذخیره عادت
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
