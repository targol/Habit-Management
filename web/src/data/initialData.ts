import { Category, Goal, AppTask, Habit } from '../types';
import { getTodayJalali, jalaliToFormattedString, addDaysJalali } from '../calendar/jalali';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-work', title: 'کاری و تحصیلی', colorHex: '#10B981', iconName: 'Briefcase' },
  { id: 'cat-personal', title: 'توسعه فردی', colorHex: '#3B82F6', iconName: 'BookOpen' },
  { id: 'cat-health', title: 'سلامت و ورزش', colorHex: '#EF4444', iconName: 'HeartPulse' },
  { id: 'cat-home', title: 'خانه و زندگی', colorHex: '#F59E0B', iconName: 'Home' },
];

export function getInitialGoals(): Goal[] {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  return [
    {
      id: 'goal-1',
      title: 'یادگیری و تسلط بر مهارت‌های تخصصی جدید',
      description: 'مطالعه مستمر، شرکت در دوره‌های کاربردی و اجرای پروژه‌های عملی در طول سال',
      visionWhy: 'ارتقای جایگاه شغلی و تسلط بر تکنولوژی‌های نوظهور کاری',
      year: today.year,
      period: 'ANNUAL',
      status: 'IN_PROGRESS',
      startDate: `${today.year}/01/01`,
      categoryId: 'cat-work',
      plantType: 'بونسای',
      createdAt: todayStr,
      history: [
        {
          id: 'hist-1',
          timestamp: `${today.year}/01/01 - ۰۹:۰۰`,
          action: 'CREATED',
          description: 'تعریف اولیه هدف کلان سالانه در آغاز سال',
        },
        {
          id: 'hist-2',
          timestamp: `${todayStr} - ۱۰:۳۰`,
          action: 'NOTE_ADDED',
          description: 'تنظیم اهداف میانی فصل پاییز و برنامه‌ریزی هفتگی تسک‌ها',
        }
      ],
    },
    {
      id: 'goal-2',
      title: 'تکمیل دوره فشرده معماری نرم‌افزار در پاییز',
      description: 'مطالعه هفتگی مباحث الگوهای طراحی و تحویل پروژه فصلی',
      visionWhy: 'پایه‌ریزی مستحکم برای تسلط بر مهارت تخصصی سالانه',
      year: today.year,
      period: 'SEASONAL',
      seasonIndex: 2, // پاییز
      parentId: 'goal-1',
      categoryId: 'cat-work',
      status: 'IN_PROGRESS',
      startDate: `${today.year}/07/01`,
      createdAt: todayStr,
      history: [
        {
          id: 'hist-3',
          timestamp: `${today.year}/07/01 - ۰۸:۰۰`,
          action: 'CREATED',
          description: 'تعریف هدف میانی برای فصل پاییز ذیل هدف تخصصی',
        }
      ],
    },
    {
      id: 'goal-3',
      title: 'مطالعه بخش مقدماتی و ماژولار در مهرماه',
      description: 'مرور ۴ فصل ابتدایی کتاب مرجع در ماه‌های اول پاییز',
      visionWhy: 'شروع قدرتمند در گام‌های ماهانه',
      year: today.year,
      period: 'MONTHLY',
      monthIndex: 7, // مهر
      parentId: 'goal-2',
      status: 'IN_PROGRESS',
      startDate: todayStr,
      createdAt: todayStr,
      history: [
        {
          id: 'hist-4',
          timestamp: `${todayStr} - ۱۱:۰۰`,
          action: 'CREATED',
          description: 'تعریف اقدام کلیدی مهرماه جهت اتصال به تسک‌های هفتگی',
        }
      ],
    },
  ];
}

export function getInitialTasks(): AppTask[] {
  const today = getTodayJalali();
  const todayStr = jalaliToFormattedString(today);
  const tomorrowStr = jalaliToFormattedString(addDaysJalali(today, 1));

  return [
    {
      id: 'task-1',
      title: 'مرور اهداف فصلی و برنامه‌ریزی هفته',
      notes: 'بررسی اولویت‌های کاری و هماهنگی تقویم',
      categoryId: 'cat-work',
      goalId: 'goal-3',
      dueDate: todayStr,
      time: '10:00',
      reminderMinutesBefore: 15,
      repeatType: 'WEEKLY',
      repeatDaysOfWeek: [0], // شنبه
      weekOfMonth: 2,
      dayOfWeek: 0,
      timerSecondsTarget: 1500, // 25 mins
      timerSecondsElapsed: 0,
      isCompleted: false,
    },
    {
      id: 'task-2',
      title: 'آبیاری گیاهان خانگی و رسیدگی به باغچه',
      notes: 'بررسی رطوبت خاک گلدان‌ها',
      categoryId: 'cat-home',
      goalId: null,
      dueDate: todayStr,
      time: '18:30',
      reminderMinutesBefore: null,
      repeatType: 'DAILY',
      repeatDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      timerSecondsTarget: 600,
      timerSecondsElapsed: 600,
      isCompleted: true,
      completedAt: todayStr,
    },
    {
      id: 'task-3',
      title: 'پیاده‌روی یا تمرین هوازی ۳۰ دقیقه',
      notes: 'در پارک یا فضای آزاد همراه با پادکست',
      categoryId: 'cat-health',
      goalId: 'goal-2',
      dueDate: todayStr,
      time: '19:00',
      reminderMinutesBefore: 30,
      repeatType: 'DAILY',
      repeatDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      timerSecondsTarget: 1800,
      timerSecondsElapsed: 0,
      isCompleted: false,
    },
    {
      id: 'task-4',
      title: 'مطالعه ۳۰ صفحه از کتاب توسعه فردی',
      notes: 'یادداشت‌برداری از نکات کلیدی فصل',
      categoryId: 'cat-personal',
      goalId: 'goal-1',
      dueDate: tomorrowStr,
      time: '21:30',
      reminderMinutesBefore: null,
      repeatType: 'NONE',
      repeatDaysOfWeek: [],
      timerSecondsTarget: 1800,
      timerSecondsElapsed: 0,
      isCompleted: false,
    },
  ];
}

export function getInitialHabits(): Habit[] {
  const today = getTodayJalali();
  const history1: Record<string, boolean> = {};
  const history2: Record<string, boolean> = {};
  const history3: Record<string, boolean> = {};

  // Populate some realistic past 28 days completion
  for (let i = 27; i >= 1; i--) {
    const dStr = jalaliToFormattedString(addDaysJalali(today, -i));
    if (i % 5 !== 0) history1[dStr] = true;
    if (i % 3 !== 0) history2[dStr] = true;
    if (i % 4 !== 0) history3[dStr] = true;
  }

  return [
    {
      id: 'habit-1',
      title: 'نوشیدن ۸ لیوان آب روزانه',
      notes: 'حفظ آب‌رسانی به بدن در طول روز',
      categoryId: 'cat-health',
      goalId: null,
      time: '08:00',
      timerMinutes: 0,
      frequency: 'DAILY',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      exemptHolidays: false,
      exemptWeekends: false,
      plantType: 'برگ انجیری',
      completionHistory: history1,
      createdAt: jalaliToFormattedString(addDaysJalali(today, -30)),
    },
    {
      id: 'habit-2',
      title: 'مطالعه کتاب و یادگیری (حداقل ۲۰ دقیقه)',
      notes: 'تمرکز عمیق بدون شبکه‌های اجتماعی',
      categoryId: 'cat-personal',
      goalId: 'goal-1',
      time: '22:00',
      timerMinutes: 20,
      frequency: 'DAILY',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      exemptHolidays: true,
      exemptWeekends: true,
      plantType: 'بونسای',
      completionHistory: history2,
      createdAt: jalaliToFormattedString(addDaysJalali(today, -30)),
    },
    {
      id: 'habit-3',
      title: 'مدیتیشن و تنفس آگاهانه',
      notes: 'شروع صبح با آرامش ذهن',
      categoryId: 'cat-health',
      goalId: null,
      time: '07:30',
      timerMinutes: 10,
      frequency: 'DAILY',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      exemptHolidays: false,
      exemptWeekends: false,
      plantType: 'کاکتوس گلدار',
      completionHistory: history3,
      createdAt: jalaliToFormattedString(addDaysJalali(today, -30)),
    },
  ];
}
