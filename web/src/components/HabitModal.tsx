import React, { useState, useEffect } from 'react';
import { Habit, Category, Goal } from '../types';
import { getTodayJalali, jalaliToFormattedString, WEEKDAYS_SHORT } from '../calendar/jalali';
import { X, Folder, Target, Clock, ShieldCheck, Sprout, Edit3, Plus } from 'lucide-react';
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
  const isEdit = Boolean(habit && habit.id);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [targetDays, setTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [exemptHolidays, setExemptHolidays] = useState(false);
  const [exemptWeekends, setExemptWeekends] = useState(false);
  const [plantType, setPlantType] = useState(ALL_PLANT_TYPES[0].id);
  const [isInheritedFromGoal, setIsInheritedFromGoal] = useState(false);

  // Synchronize state when modal opens or habit prop changes
  useEffect(() => {
    if (!isOpen) return;

    if (habit) {
      setTitle(habit.title || '');
      setNotes(habit.notes || '');
      const linkedGoal = goals.find(g => g.id === habit.goalId);
      setCategoryId(habit.categoryId || linkedGoal?.categoryId || categories[0]?.id || 'cat-health');
      setGoalId(habit.goalId || null);
      setTimerMinutes(habit.timerMinutes !== undefined ? habit.timerMinutes : 15);
      setTargetDays(
        habit.targetDaysOfWeek && habit.targetDaysOfWeek.length > 0 
          ? habit.targetDaysOfWeek 
          : [0, 1, 2, 3, 4, 5, 6]
      );
      setExemptHolidays(Boolean(habit.exemptHolidays));
      setExemptWeekends(Boolean(habit.exemptWeekends));
      setPlantType(habit.plantType || linkedGoal?.plantType || categories[0]?.plantType || ALL_PLANT_TYPES[0].id);
      setIsInheritedFromGoal(Boolean(habit.goalId));
    } else {
      setTitle('');
      setNotes('');
      const defaultCat = categories[0]?.id || 'cat-health';
      setCategoryId(defaultCat);
      setGoalId(null);
      setTimerMinutes(15);
      setTargetDays([0, 1, 2, 3, 4, 5, 6]);
      setExemptHolidays(false);
      setExemptWeekends(false);
      const catObj = categories.find(c => c.id === defaultCat);
      setPlantType(catObj?.plantType || ALL_PLANT_TYPES[0].id);
      setIsInheritedFromGoal(false);
    }
  }, [isOpen, habit, categories, goals]);

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
      if (targetDays.length === 1) return; // keep at least 1 day
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
      categoryId: categoryId || categories[0]?.id || 'cat-health',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up relative">
        {/* Sticky Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isEdit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isEdit ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {isEdit ? 'ویرایش اطلاعات عادت' : 'تعریف عادت جدید'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isEdit 
                  ? `ویرایش تناوب، هدف متصل و زمانبندی «${title || habit?.title || ''}»`
                  : 'تعیین عنوان، تناوب تکرار و زمان تمرکز'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="habit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              عنوان عادت *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="مثلاً: مطالعه کتاب روزانه یا نرمش صبحگاهی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-xs font-semibold text-gray-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              توضیحات و انگیزه
            </label>
            <textarea
              rows={2}
              placeholder="دلیل، روش انجام یا انگیزه این عادت..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Category & Goal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-emerald-600" />
                  <span>دسته‌بندی</span>
                </span>
                {isInheritedFromGoal && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    ارث‌بری از هدف
                  </span>
                )}
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-hidden font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>متصل به هدف</span>
              </label>
              <select
                value={goalId || ''}
                onChange={(e) => handleGoalChange(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-emerald-500 outline-hidden font-medium"
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

          {/* Frequency & Days of week */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800 text-xs">تناوب تکرار عادت</label>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTargetDays([0, 1, 2, 3, 4, 5, 6])}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    targetDays.length === 7
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  روزانه (هر روز)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetDays.length === 7) {
                      setTargetDays([0, 2, 4]); // Sat, Mon, Wed
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    targetDays.length < 7
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  روزهای مشخص هفته
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-1">
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
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {wName}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500">
              {targetDays.length === 7 ? '✓ این عادت هر روز هفته باید انجام شود.' : `✓ این عادت در ${targetDays.length} روز مشخص از هفته تکرار می‌شود.`}
            </p>
          </div>

          {/* Plant Symbol & Focus Timer */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>انتخاب گیاه نمادین</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-700">با انجام مرتب رشد می‌کند</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1.5 bg-emerald-50/30 rounded-xl border border-emerald-100">
              {ALL_PLANT_TYPES.map((p) => {
                const isSelected = plantType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlantType(p.id)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
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
            <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>مدت زمان تمرکز روزانه (دقیقه - اختیاری)</span>
            </label>
            <input
              type="number"
              min="0"
              max="120"
              step="5"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white font-medium"
              placeholder="مثلاً ۱۵ یا ۲۵ دقیقه"
            />
          </div>

          {/* Exemption rules */}
          <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 space-y-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>معافیت‌های هوشمند</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={exemptHolidays}
                onChange={(e) => setExemptHolidays(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>معافیت در تعطیلات رسمی تقویم شمسی</span>
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
        </form>

        {/* Sticky Footer */}
        <div className="shrink-0 px-5 py-3.5 border-t border-gray-100 bg-gray-50/95 backdrop-blur-xs flex items-center justify-end gap-2.5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 text-xs transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            form="habit-form"
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-xs cursor-pointer ${
              isEdit
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isEdit ? 'ذخیره تغییرات عادت' : 'ایجاد و ثبت عادت جدید'}
          </button>
        </div>
      </div>
    </div>
  );
};
