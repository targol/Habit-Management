import React, { useState, useEffect } from 'react';
import { Goal, GoalPeriod, GoalStatus, GoalHistoryEntry, Category } from '../types';
import { 
  getTodayJalali, 
  jalaliToFormattedString, 
  toPersianDigits, 
  PERSIAN_MONTHS, 
  getCurrentPersianDateTimeString 
} from '../calendar/jalali';
import { X, Target, Calendar, Folder, Sprout, Check, Sparkles, Edit3 } from 'lucide-react';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';

interface Props {
  isOpen: boolean;
  goal?: Goal | null;
  categories: Category[];
  existingGoals: Goal[];
  onClose: () => void;
  onSave: (goal: Goal) => void;
}

const SEASON_OPTIONS = [
  { index: 0, name: 'بهار', icon: '🌸', activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-xs', inactiveClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
  { index: 1, name: 'تابستان', icon: '☀️', activeClass: 'bg-amber-600 text-white border-amber-700 shadow-xs', inactiveClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
  { index: 2, name: 'پاییز', icon: '🍂', activeClass: 'bg-orange-600 text-white border-orange-700 shadow-xs', inactiveClass: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100' },
  { index: 3, name: 'زمستان', icon: '❄️', activeClass: 'bg-sky-600 text-white border-sky-700 shadow-xs', inactiveClass: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100' },
];

export const GoalModal: React.FC<Props> = ({
  isOpen,
  goal,
  categories,
  existingGoals,
  onClose,
  onSave,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);

  // Check if this is truly editing an existing goal
  const isEdit = Boolean(goal && goal.id && existingGoals.some(g => g.id === goal.id));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visionWhy, setVisionWhy] = useState('');
  const [year, setYear] = useState<number>(today.year);
  const [isCustomYear, setIsCustomYear] = useState(false);
  const [customYearInput, setCustomYearInput] = useState<string>(today.year.toString());
  const [period, setPeriod] = useState<GoalPeriod>('ANNUAL');
  const [status, setStatus] = useState<GoalStatus>('IN_PROGRESS');
  const [startDate, setStartDate] = useState(todayStr);
  const [seasonIndex, setSeasonIndex] = useState<number>(Math.floor((today.month - 1) / 3));
  const [monthIndex, setMonthIndex] = useState<number>(today.month);
  const [parentId, setParentId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [plantType, setPlantType] = useState<string>('بونسای');

  // Available year options: current year and next 10 years + 2 past years
  const standardYears = Array.from({ length: 13 }, (_, i) => today.year - 2 + i);

  // Synchronize state on open or whenever goal/existingGoals change
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setVisionWhy(goal.visionWhy || '');
      
      const goalYear = goal.year || today.year;
      setYear(goalYear);
      setCustomYearInput(goalYear.toString());
      setIsCustomYear(!standardYears.includes(goalYear));

      setPeriod(goal.period || 'ANNUAL');
      setStatus(goal.status || 'IN_PROGRESS');
      setStartDate(goal.startDate || todayStr);
      setSeasonIndex(goal.seasonIndex ?? 0);
      setMonthIndex(goal.monthIndex ?? today.month);
      setParentId(goal.parentId || null);
      setCategoryId(goal.categoryId || categories[0]?.id || 'cat-work');
      setPlantType(goal.plantType || 'بونسای');
    } else {
      // New Goal mode
      setTitle(goal?.title || '');
      setDescription(goal?.description || '');
      setVisionWhy(goal?.visionWhy || '');
      
      const defaultYear = goal?.year || today.year;
      setYear(defaultYear);
      setCustomYearInput(defaultYear.toString());
      setIsCustomYear(false);

      setPeriod(goal?.period || (goal?.parentId ? 'SEASONAL' : 'ANNUAL'));
      setStatus('IN_PROGRESS');
      setStartDate(goal?.startDate || todayStr);
      setSeasonIndex(goal?.seasonIndex ?? Math.floor((today.month - 1) / 3));
      setMonthIndex(goal?.monthIndex ?? today.month);
      setParentId(goal?.parentId || null);
      setCategoryId(goal?.categoryId || categories[0]?.id || 'cat-work');
      setPlantType(goal?.plantType || 'بونسای');
    }
  }, [isOpen, goal, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const timestampNow = getCurrentPersianDateTimeString();
    const effectiveYear = isCustomYear 
      ? (parseInt(customYearInput, 10) || today.year)
      : year;

    let history: GoalHistoryEntry[] = isEdit && goal?.history ? [...goal.history] : [];

    if (!isEdit) {
      // Brand new goal
      history.push({
        id: `hist-${Date.now()}`,
        timestamp: timestampNow,
        action: 'CREATED',
        description: `ایجاد هدف ${period === 'ANNUAL' ? 'سالانه' : period === 'SEASONAL' ? 'میانی فصلی' : 'میانی ماهانه'} برای سال ${toPersianDigits(effectiveYear)}`,
      });
    } else if (goal) {
      // Edited goal - record what was changed
      const changes: string[] = [];
      if (goal.title !== title.trim()) changes.push(`عنوان: «${title.trim()}»`);
      if (goal.year !== effectiveYear) changes.push(`سال: ${toPersianDigits(effectiveYear)}`);
      if (goal.categoryId !== categoryId) {
        const c = categories.find(cat => cat.id === categoryId);
        changes.push(`دسته‌بندی: ${c?.title || categoryId}`);
      }
      if (goal.status !== status) {
        const statusMap: Record<GoalStatus, string> = {
          NOT_STARTED: 'شروع نشده',
          IN_PROGRESS: 'در حال انجام',
          COMPLETED: 'تکمیل شده',
          PAUSED: 'متوقف شده',
        };
        changes.push(`وضعیت: ${statusMap[status]}`);
      }
      if (goal.period !== period) changes.push(`نوع بازه: ${period}`);

      const desc = changes.length > 0 
        ? `ویرایش مشخصات: ${changes.join('، ')}`
        : 'ویرایش و بروزرسانی هدف';

      history.push({
        id: `hist-${Date.now()}`,
        timestamp: timestampNow,
        action: goal.status !== status ? 'STATUS_CHANGED' : 'EDITED',
        description: desc,
        previousValues: {
          title: goal.title,
          description: goal.description,
          period: goal.period,
          status: goal.status,
        },
      });
    }

    const finalGoal: Goal = {
      id: isEdit && goal ? goal.id : `goal-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      visionWhy: visionWhy.trim(),
      year: effectiveYear,
      period,
      status,
      startDate: startDate || todayStr,
      seasonIndex: period === 'SEASONAL' ? seasonIndex : undefined,
      monthIndex: period === 'MONTHLY' ? monthIndex : undefined,
      parentId: parentId || null,
      categoryId,
      plantType,
      history,
      createdAt: isEdit && goal ? goal.createdAt : todayStr,
    };

    onSave(finalGoal);
    onClose();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-emerald-100 relative my-8 animate-scale-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`p-2.5 rounded-xl ${isEdit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {isEdit ? <Edit3 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isEdit ? 'ویرایش هدف انتخابی' : 'تعریف هدف جدید'}
            </h3>
            <p className="text-[11px] text-gray-500">
              {isEdit 
                ? `ویرایش و بروزرسانی هدف «${title || goal?.title || ''}»`
                : 'مشخصات، دسته‌بندی، سال و زمانبندی هدف جدید'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              عنوان هدف *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: یادگیری مکالمه انگلیسی یا توسعه محصول جدید"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-xs font-medium"
            />
          </div>

          {/* Category Selection (دسته‌بندی هدف) - PROMINENT */}
          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span>تعیین دسته‌بندی هدف *</span>
              </label>
              {selectedCategory && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                  style={{
                    backgroundColor: `${selectedCategory.colorHex}15`,
                    color: selectedCategory.colorHex,
                    borderColor: `${selectedCategory.colorHex}40`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedCategory.colorHex }}
                  />
                  <span>{selectedCategory.title}</span>
                </span>
              )}
            </div>

            {/* Visual Category Chips */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'text-white shadow-xs font-bold'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? c.colorHex : undefined,
                      borderColor: isSelected ? c.colorHex : `${c.colorHex}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#ffffff' : c.colorHex }}
                    />
                    <span>{c.title}</span>
                    {isSelected && <Check className="w-3 h-3 text-white mr-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vision Why */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              چرا این هدف مهم است؟ (چرایی و انگیزه اصلی)
            </label>
            <textarea
              rows={2}
              placeholder="ارزش، انگیزه و دستاورد نهایی این هدف برای شما..."
              value={visionWhy}
              onChange={(e) => setVisionWhy(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Period & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">نوع بازه زمانی هدف</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white font-medium"
              >
                <option value="ANNUAL">هدف کلان سالانه (یک سال کامل)</option>
                <option value="SEASONAL">هدف میانی فصلی (یک فصل)</option>
                <option value="MONTHLY">هدف میانی ماهانه (یک ماه)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">وضعیت هدف</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white font-medium"
              >
                <option value="NOT_STARTED">شروع نشده</option>
                <option value="IN_PROGRESS">در حال انجام</option>
                <option value="COMPLETED">تکمیل شده</option>
                <option value="PAUSED">متوقف شده</option>
              </select>
            </div>
          </div>

          {/* Year Selection (برای همان سال یا سال‌های بعد) */}
          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>تعیین سال هدف (امسال یا سال‌های آینده)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomYear(!isCustomYear)}
                className="text-[11px] text-emerald-700 font-bold hover:underline"
              >
                {isCustomYear ? 'انتخاب از لیست سال‌ها' : 'ورود سال دلخواه...'}
              </button>
            </div>

            {!isCustomYear ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white font-semibold"
                  >
                    {standardYears.map((y) => {
                      const isCurrentYear = y === today.year;
                      const isFuture = y > today.year;
                      const diff = y - today.year;
                      const label = isCurrentYear
                        ? `سال ${toPersianDigits(y)} (سال جاری)`
                        : isFuture
                        ? `سال ${toPersianDigits(y)} (${toPersianDigits(diff)} سال بعد)`
                        : `سال ${toPersianDigits(y)}`;

                      return (
                        <option key={y} value={y}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white"
                    title="تاریخ فعال‌سازی"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    min={1380}
                    max={1499}
                    value={customYearInput}
                    onChange={(e) => setCustomYearInput(e.target.value)}
                    placeholder="مثلاً: ۱۴۰۶ یا ۱۴۱۰"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs bg-white font-bold"
                  />
                  <span className="text-[10px] text-emerald-800 mt-0.5 block">
                    تعیین آزادانه هر سال خورشیدی در آینده
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white"
                    title="تاریخ شروع"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sub-period: Seasonal with Distinct Seasonal Colors */}
          {period === 'SEASONAL' && (
            <div className="space-y-2 p-3 rounded-xl border border-emerald-200 bg-gray-50/50">
              <label className="block font-bold text-gray-800">
                کدام فصل سال؟ (رنگ‌بندی اختصاصی هر فصل)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEASON_OPTIONS.map((s) => {
                  const isSelected = seasonIndex === s.index;
                  return (
                    <button
                      key={s.index}
                      type="button"
                      onClick={() => setSeasonIndex(s.index)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected ? s.activeClass : s.inactiveClass
                      }`}
                    >
                      <span className="text-sm">{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-period: Monthly */}
          {period === 'MONTHLY' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">کدام ماه سال؟</label>
              <select
                value={monthIndex}
                onChange={(e) => setMonthIndex(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
              >
                {PERSIAN_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    ماه {m} ({toPersianDigits(idx + 1)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Goal link (if intermediate) */}
          {period !== 'ANNUAL' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">هدف بالادستی (هدف مادر)</label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
              >
                <option value="">بدون هدف مادر (مستقل)</option>
                {existingGoals
                  .filter(g => g.id !== goal?.id && g.period === 'ANNUAL')
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      هدف سالانه {toPersianDigits(g.year)}: {g.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Plant Mascot */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>گیاه یا درخت نمادین این هدف در باغچه</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <PlantIcon type={plantType} size="sm" />
              </div>
              <select
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
              >
                {ALL_PLANT_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Description */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">توضیحات و یادداشت تکمیلی</label>
            <textarea
              rows={2}
              placeholder="نکات اجرایی، شاخص‌های موفقیت و مراحل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm cursor-pointer ${
                isEdit
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isEdit ? 'ذخیره تغییرات هدف' : 'ایجاد و ثبت هدف جدید'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
