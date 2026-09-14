import React, { useState } from 'react';
import { Goal, AppTask, Habit, Category } from '../types';
import { 
  getTodayJalali, 
  toPersianDigits, 
  PERSIAN_MONTHS, 
  WEEKDAYS, 
  WEEKS_OF_MONTH, 
  jalaliToFormattedString, 
  getCurrentPersianDateTimeString 
} from '../calendar/jalali';
import { 
  X, 
  Sparkles, 
  Target, 
  Layers, 
  CheckSquare, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Calendar,
  Clock,
  Folder,
  Sprout,
  Flame
} from 'lucide-react';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';

interface Props {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSaveComplete: (annualGoal: Goal, intermediateGoal?: Goal, microTask?: AppTask, microHabit?: Habit) => void;
}

const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

export const AnnualGoalWizardModal: React.FC<Props> = ({
  isOpen,
  categories,
  onClose,
  onSaveComplete,
}) => {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Annual Goal
  const [annualTitle, setAnnualTitle] = useState('');
  const [annualDescription, setAnnualDescription] = useState('');
  const [annualVisionWhy, setAnnualVisionWhy] = useState('');
  const [annualYear, setAnnualYear] = useState<number>(today.year);
  const [isCustomAnnualYear, setIsCustomAnnualYear] = useState(false);
  const [customAnnualYearInput, setCustomAnnualYearInput] = useState<string>(today.year.toString());
  const [annualCategoryId, setAnnualCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [annualPlantType, setAnnualPlantType] = useState<string>('بونسای');
  const [startTimingType, setStartTimingType] = useState<'TODAY' | 'YEAR_START' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState(todayStr);

  // Available year options: current year and next 10 years + 2 past years
  const standardYears = Array.from({ length: 13 }, (_, i) => today.year - 2 + i);

  // Step 2: Intermediate Goal (Seasonal / Monthly)
  const [hasIntermediate, setHasIntermediate] = useState(true);
  const [interPeriod, setInterPeriod] = useState<'SEASONAL' | 'MONTHLY'>('SEASONAL');
  const [interSeasonIndex, setInterSeasonIndex] = useState<number>(Math.floor((today.month - 1) / 3));
  const [interMonthIndex, setInterMonthIndex] = useState<number>(today.month);
  const [interCategoryId, setInterCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [interTitle, setInterTitle] = useState('');
  const [interDescription, setInterDescription] = useState('');

  // Step 3: Micro-Task & Micro-Habit (Weekly & Daily)
  const [hasMicroTask, setHasMicroTask] = useState(true);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskWeekOfMonth, setTaskWeekOfMonth] = useState<number>(1);
  const [taskDayOfWeek, setTaskDayOfWeek] = useState<number>(0); // شنبه
  const [taskCategoryId, setTaskCategoryId] = useState<string>(categories[0]?.id || 'cat-work');
  const [taskTimerMinutes, setTaskTimerMinutes] = useState<number>(25);

  const [hasMicroHabit, setHasMicroHabit] = useState(false);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitTimerMinutes, setHabitTimerMinutes] = useState<number>(15);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (!annualTitle.trim()) {
      setStep(1);
      return;
    }

    const effectiveYear = isCustomAnnualYear
      ? (parseInt(customAnnualYearInput, 10) || today.year)
      : annualYear;

    const effectiveStartDate =
      startTimingType === 'TODAY'
        ? todayStr
        : startTimingType === 'YEAR_START'
        ? `${effectiveYear}/01/01`
        : customStartDate;

    const annualGoalId = `goal-annual-${Date.now()}`;
    const timestampNow = getCurrentPersianDateTimeString();

    // 1. Annual Goal
    const annualGoal: Goal = {
      id: annualGoalId,
      title: annualTitle.trim(),
      description: annualDescription.trim(),
      visionWhy: annualVisionWhy.trim(),
      year: effectiveYear,
      period: 'ANNUAL',
      status: 'IN_PROGRESS',
      startDate: effectiveStartDate,
      categoryId: annualCategoryId,
      plantType: annualPlantType,
      createdAt: todayStr,
      history: [
        {
          id: `hist-${Date.now()}-1`,
          timestamp: timestampNow,
          action: 'CREATED',
          description: `طراحی و تعریف هدف سالانه برای سال ${toPersianDigits(effectiveYear)} (فعال از تاریخ ${toPersianDigits(effectiveStartDate)})`,
        },
      ],
    };

    let intermediateGoal: Goal | undefined;
    let microTask: AppTask | undefined;
    let microHabit: Habit | undefined;

    // 2. Intermediate Goal
    if (hasIntermediate && interTitle.trim()) {
      const interGoalId = `goal-inter-${Date.now() + 1}`;
      const scheduleLabel =
        interPeriod === 'SEASONAL'
          ? `فصل ${SEASONS[interSeasonIndex]}`
          : `ماه ${PERSIAN_MONTHS[interMonthIndex - 1]}`;

      intermediateGoal = {
        id: interGoalId,
        title: interTitle.trim(),
        description: interDescription.trim(),
        year: effectiveYear,
        period: interPeriod,
        seasonIndex: interSeasonIndex,
        monthIndex: interPeriod === 'MONTHLY' ? interMonthIndex : undefined,
        parentId: annualGoalId,
        categoryId: interCategoryId || annualCategoryId,
        plantType: annualPlantType,
        status: 'IN_PROGRESS',
        startDate: effectiveStartDate,
        createdAt: todayStr,
        history: [
          {
            id: `hist-${Date.now()}-2`,
            timestamp: timestampNow,
            action: 'CREATED',
            description: `تعریف هدف میانی در بازه زمانی ${scheduleLabel} ذیل هدف سالانه`,
          },
        ],
      };
    }

    const parentGoalIdForItems = intermediateGoal ? intermediateGoal.id : annualGoalId;
    const targetCategory = interCategoryId || annualCategoryId;

    // 3. Micro Task
    if (hasMicroTask && taskTitle.trim()) {
      microTask = {
        id: `task-micro-${Date.now() + 2}`,
        title: taskTitle.trim(),
        notes: taskNotes.trim(),
        categoryId: taskCategoryId || targetCategory,
        goalId: parentGoalIdForItems,
        dueDate: todayStr,
        time: '10:00',
        reminderMinutesBefore: 15,
        repeatType: 'NONE',
        repeatDaysOfWeek: [taskDayOfWeek],
        weekOfMonth: taskWeekOfMonth,
        dayOfWeek: taskDayOfWeek,
        timerSecondsTarget: taskTimerMinutes * 60,
        timerSecondsElapsed: 0,
        isCompleted: false,
      };
    }

    // 4. Micro Habit
    if (hasMicroHabit && habitTitle.trim()) {
      microHabit = {
        id: `habit-micro-${Date.now() + 3}`,
        title: habitTitle.trim(),
        categoryId: targetCategory,
        plantType: annualPlantType,
        frequency: 'DAILY',
        targetDaysPerWeek: 7,
        selectedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        currentStreak: 0,
        longestStreak: 0,
        completionHistory: {},
        goalId: parentGoalIdForItems,
        timerMinutes: habitTimerMinutes,
      };
    }

    onSaveComplete(annualGoal, intermediateGoal, microTask, microHabit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-emerald-100 relative my-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              طراحی و تعریف اهداف سالانه
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              تعریف چشم‌انداز، شکستن به اهداف فصلی/ماهانه و گام‌های هفتگی و روزانه
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-2 text-xs">
          <div className={`flex items-center gap-1.5 font-bold ${step >= 1 ? 'text-emerald-700' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              ۱
            </span>
            <span>هدف کلان سالانه</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

          <div className={`flex items-center gap-1.5 font-bold ${step >= 2 ? 'text-emerald-700' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              ۲
            </span>
            <span>اهداف میانی (فصل/ماه)</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

          <div className={`flex items-center gap-1.5 font-bold ${step >= 3 ? 'text-emerald-700' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              ۳
            </span>
            <span>تسک‌های ریزتر (هفته/روز)</span>
          </div>
        </div>

        {/* Step 1: Annual Goal Form */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                عنوان هدف سالانه *
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: یادگیری و تسلط بر مهارت شغلی جدید یا سلامتی پایدار"
                value={annualTitle}
                onChange={(e) => setAnnualTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                چرا این هدف برای شما مهم است؟ (چرایی و انگیزه اصلی)
              </label>
              <textarea
                rows={2}
                placeholder="دستاورد نهایی این هدف، تغییراتی که در زندگی یا شغل من ایجاد می‌کند..."
                value={annualVisionWhy}
                onChange={(e) => setAnnualVisionWhy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
              />
            </div>

            {/* Year & Timing Selection */}
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>سال خورشیدی هدف (امسال یا سال‌های آینده)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomAnnualYear(!isCustomAnnualYear)}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  {isCustomAnnualYear ? 'انتخاب از لیست سال‌ها' : 'ورود سال دلخواه...'}
                </button>
              </div>

              {!isCustomAnnualYear ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={annualYear}
                      onChange={(e) => setAnnualYear(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-semibold text-xs"
                    >
                      {standardYears.map((y) => {
                        const isCurrentYear = y === today.year;
                        const isFuture = y > today.year;
                        const diff = y - today.year;
                        const label = isCurrentYear
                          ? `سال ${toPersianDigits(y)} (امسال)`
                          : isFuture
                          ? `سال ${toPersianDigits(y)} (${toPersianDigits(diff)} سال بعد)`
                          : `سال ${toPersianDigits(y)}`;

                        return (
                          <option key={y} value={y}>{label}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <select
                      value={startTimingType}
                      onChange={(e) => setStartTimingType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs"
                    >
                      <option value="TODAY">از همین امروز ({toPersianDigits(todayStr)})</option>
                      <option value="YEAR_START">از ابتدای سال (۰۱/۰۱)</option>
                      <option value="CUSTOM">تاریخ دلخواه</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      min={1380}
                      max={1499}
                      value={customAnnualYearInput}
                      onChange={(e) => setCustomAnnualYearInput(e.target.value)}
                      placeholder="مثلاً: ۱۴۰۶ یا ۱۴۱۰"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs bg-white font-bold"
                    />
                  </div>
                  <div>
                    <select
                      value={startTimingType}
                      onChange={(e) => setStartTimingType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs"
                    >
                      <option value="TODAY">از همین امروز ({toPersianDigits(todayStr)})</option>
                      <option value="YEAR_START">از ابتدای سال (۰۱/۰۱)</option>
                      <option value="CUSTOM">تاریخ دلخواه</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {startTimingType === 'CUSTOM' && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">تاریخ شروع دلخواه (شمسی)</label>
                <input
                  type="text"
                  placeholder="۱۴۰۳/۰۷/۱۵"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            )}

            {/* Category selection - PROMINENT */}
            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span>تعیین دسته‌بندی هدف سالانه *</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const isSelected = annualCategoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAnnualCategoryId(c.id)}
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

            {/* Plant selection */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>گیاه نمادین هدف در باغچه</span>
              </label>
              <select
                value={annualPlantType}
                onChange={(e) => setAnnualPlantType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
              >
                {ALL_PLANT_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">توضیحات تکمیلی و راهبردها</label>
              <textarea
                rows={2}
                placeholder="توضیحات یا شاخص‌های موفقیت..."
                value={annualDescription}
                onChange={(e) => setAnnualDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>
          </div>
        )}

        {/* Step 2: Intermediate Goal Form */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold block">تعریف اهداف میانی بر اساس هدف اصلی</span>
                <span className="text-[11px] text-emerald-800">
                  برای رسیدن به «{annualTitle || 'هدف سالانه'}»، گام‌های فصلی و ماهانه تعیین کنید.
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={hasIntermediate}
                  onChange={(e) => setHasIntermediate(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>تعریف مرحله میانی</span>
              </label>
            </div>

            {hasIntermediate && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">نوع بازه زمانی میانی</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInterPeriod('SEASONAL')}
                        className={`flex-1 py-2 rounded-xl font-bold transition-colors ${
                          interPeriod === 'SEASONAL'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        فصلی
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterPeriod('MONTHLY')}
                        className={`flex-1 py-2 rounded-xl font-bold transition-colors ${
                          interPeriod === 'MONTHLY'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        ماهانه
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {interPeriod === 'SEASONAL' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block font-semibold text-gray-700">کدام فصل سال؟ (فصل‌های باقیمانده سال)</label>
                          <span className="text-[10px] text-emerald-700 font-medium">فصول باقیمانده سال جاری</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { idx: 0, name: 'بهار', icon: '🌸', active: 'bg-emerald-600 text-white border-emerald-700 shadow-xs', inactive: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
                            { idx: 1, name: 'تابستان', icon: '☀️', active: 'bg-amber-600 text-white border-amber-700 shadow-xs', inactive: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
                            { idx: 2, name: 'پاییز', icon: '🍂', active: 'bg-orange-600 text-white border-orange-700 shadow-xs', inactive: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100' },
                            { idx: 3, name: 'زمستان', icon: '❄️', active: 'bg-sky-600 text-white border-sky-700 shadow-xs', inactive: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100' },
                          ].map((s) => {
                            const curSeasonIdx = Math.floor((today.month - 1) / 3);
                            const isCurrent = s.idx === curSeasonIdx;
                            const isRemaining = s.idx >= curSeasonIdx;

                            return (
                              <button
                                key={s.idx}
                                type="button"
                                onClick={() => setInterSeasonIndex(s.idx)}
                                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
                                  interSeasonIndex === s.idx ? s.active : s.inactive
                                }`}
                              >
                                <span className="text-sm">{s.icon}</span>
                                <span>{s.name}</span>
                                <span className={`text-[9px] px-1 rounded-sm ${
                                  isCurrent 
                                    ? (interSeasonIndex === s.idx ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900') 
                                    : isRemaining 
                                    ? (interSeasonIndex === s.idx ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600')
                                    : (interSeasonIndex === s.idx ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400')
                                }`}>
                                  {isCurrent ? 'جاری' : isRemaining ? 'باقیمانده' : 'گذشته'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">کدام ماه سال؟</label>
                        <select
                          value={interMonthIndex}
                          onChange={(e) => setInterMonthIndex(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        >
                          {PERSIAN_MONTHS.map((m, idx) => (
                            <option key={idx + 1} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category for intermediate goal */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دسته‌بندی این مرحله میانی:</span>
                  </span>
                  <select
                    value={interCategoryId}
                    onChange={(e) => setInterCategoryId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">عنوان هدف میانی *</label>
                  <input
                    type="text"
                    placeholder={
                      interPeriod === 'SEASONAL'
                        ? 'مثلاً: گذراندن دوره مقدماتی و تکمیل پروژه آزمایشی در پاییز'
                        : 'مثلاً: مطالعه ۵ فصل اول و شرکت در آزمون آزمایشی در مهرماه'
                    }
                    value={interTitle}
                    onChange={(e) => setInterTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">توضیحات مرحله میانی</label>
                  <textarea
                    rows={2}
                    placeholder="اقدامات و خروجی مشخص مورد انتظار در این فصل/ماه..."
                    value={interDescription}
                    onChange={(e) => setInterDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Micro-Tasks Form */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold block">تسک‌های ریزتر هفتگی و روزانه</span>
                <span className="text-[11px] text-emerald-800">
                  برای شروع، اولین اقدام عملی را با زمانبندی مشخص هفتگی و روزانه ثبت کنید.
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={hasMicroTask}
                  onChange={(e) => setHasMicroTask(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>افزودن اولین تسک خرد</span>
              </label>
            </div>

            {hasMicroTask && (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">عنوان اقدام / تسک ریز *</label>
                  <input
                    type="text"
                    placeholder="مثلاً: دانلود و مطالعه فصل اول منبع یا ثبت‌نام در سامانه"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">کدام هفته ماه؟</label>
                    <select
                      value={taskWeekOfMonth}
                      onChange={(e) => setTaskWeekOfMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    >
                      {WEEKS_OF_MONTH.map((w, idx) => (
                        <option key={idx + 1} value={idx + 1}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">کدام روز هفته؟</label>
                    <select
                      value={taskDayOfWeek}
                      onChange={(e) => setTaskDayOfWeek(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    >
                      {WEEKDAYS.map((d, idx) => (
                        <option key={idx} value={idx}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">دسته‌بندی موضوعی</label>
                    <select
                      value={taskCategoryId}
                      onChange={(e) => setTaskCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">مدت تمرکز پیشنهادی (دقیقه)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      step={5}
                      value={taskTimerMinutes}
                      onChange={(e) => setTaskTimerMinutes(parseInt(e.target.value, 10) || 25)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">یادداشت تسک</label>
                  <textarea
                    rows={2}
                    placeholder="نکات اجرایی..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </>
            )}

            {/* Micro-Habit section */}
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-amber-950 flex items-center justify-between mt-3">
              <div>
                <span className="font-bold block flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>عادت روزانه مرتبط با این هدف</span>
                </span>
                <span className="text-[11px] text-amber-800">
                  یک عادت مستمر برای ساختن هویت و انضباط رسیدن به هدف
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={hasMicroHabit}
                  onChange={(e) => setHasMicroHabit(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span>افزودن عادت روزانه</span>
              </label>
            </div>

            {hasMicroHabit && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">عنوان عادت روزانه *</label>
                  <input
                    type="text"
                    placeholder="مثلاً: ۲۰ دقیقه مطالعه مستمر یا ورزش صبحگاهی"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">تایمر تمرکز عادت (دقیقه)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      step={5}
                      value={habitTimerMinutes}
                      onChange={(e) => setHabitTimerMinutes(parseInt(e.target.value, 10) || 15)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div className="flex items-center text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200 self-end">
                    <span>دسته‌بندی و گیاه این عادت مستقیماً از هدف ارث‌بری می‌شود.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1 hover:bg-gray-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 font-semibold text-xs hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !annualTitle.trim()) {
                  alert('لطفاً عنوان هدف سالانه را وارد فرمایید.');
                  return;
                }
                setStep((s) => (s + 1) as any);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
            >
              <span>مرحله بعد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>تأیید و ذخیره مجموعه اهداف</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
