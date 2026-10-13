import { AppTask, Goal, Habit, Category, UserProfile, ReminderSettings } from '../types';

export interface ValidationEntityCounts {
  categories: number;
  goals: number;
  tasks: number;
  habits: number;
  corruptedTasks: number;
  corruptedGoals: number;
  corruptedHabits: number;
  corruptedCategories: number;
}

export interface ValidatedBackupResult {
  isValid: boolean;
  fatalError: string | null;
  warnings: string[];
  counts: ValidationEntityCounts;
  exportDateString?: string;
  appName?: string;
  data: {
    categories: Category[];
    goals: Goal[];
    tasks: AppTask[];
    habits: Habit[];
    userProfile?: UserProfile;
    reminderSettings?: ReminderSettings;
  } | null;
}

/**
 * Validates and sanitizes a raw JSON string from a backup file or pasted text.
 * Prevents any corrupted or malformed data from wiping existing state.
 */
export function validateAndSanitizeBackupJson(rawJson: string): ValidatedBackupResult {
  const emptyCounts: ValidationEntityCounts = {
    categories: 0,
    goals: 0,
    tasks: 0,
    habits: 0,
    corruptedTasks: 0,
    corruptedGoals: 0,
    corruptedHabits: 0,
    corruptedCategories: 0,
  };

  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return {
      isValid: false,
      fatalError: 'فایل یا متن انتخابی خالی است. لطفاً یک فایل معتبر پشتیبان را انتخاب کنید.',
      warnings: [],
      counts: emptyCounts,
      data: null,
    };
  }

  // 1. Syntactic JSON Parse check
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson.trim());
  } catch (err: any) {
    return {
      isValid: false,
      fatalError: 'خطای نحوی (Syntax Error): ساختار فایل JSON نامعتبر است. لطفاً مطمئن شوید فایل بدون آسیب دانلود شده است.',
      warnings: [],
      counts: emptyCounts,
      data: null,
    };
  }

  // 2. Structural Root Check
  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      fatalError: 'ساختار ریشه فایل نامعتبر است. داده‌ها باید به صورت شیء (Object) استاندارد باشند.',
      warnings: [],
      counts: emptyCounts,
      data: null,
    };
  }

  // Support direct array of tasks (Task-only backup format)
  if (Array.isArray(parsed)) {
    return validateDirectTasksArray(parsed);
  }

  const root = (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data))
    ? parsed.data
    : parsed;

  const warnings: string[] = [];
  let corruptedTasks = 0;
  let corruptedGoals = 0;
  let corruptedHabits = 0;
  let corruptedCategories = 0;

  // 3. Deep Tasks Validation & Sanitization
  const validTasks: AppTask[] = [];
  const rawTasks = Array.isArray(root.tasks) ? root.tasks : [];
  for (const item of rawTasks) {
    if (
      item && 
      typeof item === 'object' && 
      (typeof item.id === 'string' || typeof item.id === 'number') && 
      String(item.id).trim() && 
      typeof item.title === 'string' && 
      item.title.trim()
    ) {
      validTasks.push({
        id: String(item.id).trim(),
        title: String(item.title).trim(),
        isCompleted: Boolean(item.isCompleted),
        categoryId: typeof item.categoryId === 'string' && item.categoryId.trim() ? item.categoryId.trim() : 'cat-work',
        dueDate: typeof item.dueDate === 'string' ? item.dueDate : undefined,
        time: typeof item.time === 'string' ? item.time : undefined,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
        priority: (item.priority === 'HIGH' || item.priority === 'MEDIUM' || item.priority === 'LOW') ? item.priority : 'MEDIUM',
        isImportant: Boolean(item.isImportant),
        reminderEnabled: Boolean(item.reminderEnabled),
        reminderTime: typeof item.reminderTime === 'string' ? item.reminderTime : undefined,
        reminderDate: typeof item.reminderDate === 'string' ? item.reminderDate : undefined,
        repeatType: (item.repeatType === 'DAILY' || item.repeatType === 'WEEKLY' || item.repeatType === 'NONE') ? item.repeatType : 'NONE',
        repeatDaysOfWeek: Array.isArray(item.repeatDaysOfWeek) ? item.repeatDaysOfWeek.filter((d: any) => typeof d === 'number') : [],
        completedAt: typeof item.completedAt === 'string' ? item.completedAt : undefined,
        nextSnoozeAt: typeof item.nextSnoozeAt === 'string' ? item.nextSnoozeAt : undefined,
        customAlarmSound: typeof item.customAlarmSound === 'string' ? item.customAlarmSound : undefined,
        lastNotifiedAt: typeof item.lastNotifiedAt === 'string' ? item.lastNotifiedAt : undefined,
      });
    } else {
      corruptedTasks++;
    }
  }

  // 4. Deep Goals Validation & Sanitization
  const validGoals: Goal[] = [];
  const rawGoals = Array.isArray(root.goals) ? root.goals : [];
  for (const item of rawGoals) {
    if (
      item && 
      typeof item === 'object' && 
      (typeof item.id === 'string' || typeof item.id === 'number') && 
      String(item.id).trim() && 
      typeof item.title === 'string' && 
      item.title.trim()
    ) {
      validGoals.push({
        id: String(item.id).trim(),
        title: String(item.title).trim(),
        categoryId: typeof item.categoryId === 'string' && item.categoryId.trim() ? item.categoryId.trim() : 'cat-work',
        targetDate: typeof item.targetDate === 'string' ? item.targetDate : '',
        timeframe: (item.timeframe === 'YEAR' || item.timeframe === 'SEASON' || item.timeframe === 'MONTH') ? item.timeframe : 'YEAR',
        status: (item.status === 'ACTIVE' || item.status === 'COMPLETED' || item.status === 'ARCHIVED') ? item.status : 'ACTIVE',
        progress: typeof item.progress === 'number' && !isNaN(item.progress) ? Math.max(0, Math.min(100, item.progress)) : 0,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
        history: Array.isArray(item.history) ? item.history : [],
        year: typeof item.year === 'number' ? item.year : undefined,
        seasonNumber: typeof item.seasonNumber === 'number' ? item.seasonNumber : undefined,
        monthNumber: typeof item.monthNumber === 'number' ? item.monthNumber : undefined,
      });
    } else {
      corruptedGoals++;
    }
  }

  // 5. Deep Habits Validation & Sanitization
  const validHabits: Habit[] = [];
  const rawHabits = Array.isArray(root.habits) ? root.habits : [];
  for (const item of rawHabits) {
    if (
      item && 
      typeof item === 'object' && 
      (typeof item.id === 'string' || typeof item.id === 'number') && 
      String(item.id).trim() && 
      typeof item.title === 'string' && 
      item.title.trim()
    ) {
      validHabits.push({
        id: String(item.id).trim(),
        title: String(item.title).trim(),
        categoryId: typeof item.categoryId === 'string' && item.categoryId.trim() ? item.categoryId.trim() : 'cat-work',
        targetDaysOfWeek: Array.isArray(item.targetDaysOfWeek) 
          ? item.targetDaysOfWeek.filter((d: any) => typeof d === 'number') 
          : [0, 1, 2, 3, 4, 5, 6],
        streak: typeof item.streak === 'number' ? Math.max(0, item.streak) : 0,
        completionHistory: item.completionHistory && typeof item.completionHistory === 'object' ? item.completionHistory : {},
        notes: typeof item.notes === 'string' ? item.notes : undefined,
      });
    } else {
      corruptedHabits++;
    }
  }

  // 6. Deep Categories Validation
  const validCategories: Category[] = [];
  const rawCats = Array.isArray(root.categories) ? root.categories : [];
  for (const item of rawCats) {
    if (
      item && 
      typeof item === 'object' && 
      (typeof item.id === 'string' || typeof item.id === 'number') && 
      String(item.id).trim() && 
      typeof item.title === 'string' && 
      item.title.trim()
    ) {
      validCategories.push({
        id: String(item.id).trim(),
        title: String(item.title).trim(),
        colorHex: typeof item.colorHex === 'string' && item.colorHex.startsWith('#') ? item.colorHex : '#10B981',
        iconName: typeof item.iconName === 'string' ? item.iconName : 'Briefcase',
        plantType: typeof item.plantType === 'string' ? item.plantType : 'بونسای',
      });
    } else {
      corruptedCategories++;
    }
  }

  // 7. User Profile Validation
  let validUserProfile: UserProfile | undefined = undefined;
  if (root.userProfile && typeof root.userProfile === 'object') {
    validUserProfile = {
      name: typeof root.userProfile.name === 'string' && root.userProfile.name.trim() ? root.userProfile.name.trim() : 'باغبان جوانه',
      title: typeof root.userProfile.title === 'string' ? root.userProfile.title : '',
      avatarUrl: typeof root.userProfile.avatarUrl === 'string' ? root.userProfile.avatarUrl : '🌱',
      bio: typeof root.userProfile.bio === 'string' ? root.userProfile.bio : '',
    };
  }

  // 8. Reminder Settings Validation
  let validReminderSettings: ReminderSettings | undefined = undefined;
  if (root.reminderSettings && typeof root.reminderSettings === 'object') {
    validReminderSettings = {
      enabled: typeof root.reminderSettings.enabled === 'boolean' ? root.reminderSettings.enabled : true,
      soundEnabled: typeof root.reminderSettings.soundEnabled === 'boolean' ? root.reminderSettings.soundEnabled : true,
      selectedSoundId: typeof root.reminderSettings.selectedSoundId === 'string' ? root.reminderSettings.selectedSoundId : 'serenity',
      volume: typeof root.reminderSettings.volume === 'number' ? root.reminderSettings.volume : 0.8,
      customSounds: Array.isArray(root.reminderSettings.customSounds) ? root.reminderSettings.customSounds : [],
      snoozeIntervalMinutes: typeof root.reminderSettings.snoozeIntervalMinutes === 'number' ? root.reminderSettings.snoozeIntervalMinutes : 10,
      availableSnoozeIntervals: Array.isArray(root.reminderSettings.availableSnoozeIntervals) ? root.reminderSettings.availableSnoozeIntervals : [5, 10, 15, 30, 60],
      autoReNotifyCount: typeof root.reminderSettings.autoReNotifyCount === 'number' ? root.reminderSettings.autoReNotifyCount : 2,
      autoReNotifyIntervalMinutes: typeof root.reminderSettings.autoReNotifyIntervalMinutes === 'number' ? root.reminderSettings.autoReNotifyIntervalMinutes : 10,
      notifyBeforeHolidayTasks: Boolean(root.reminderSettings.notifyBeforeHolidayTasks),
      holidayLeadMinutes: typeof root.reminderSettings.holidayLeadMinutes === 'number' ? root.reminderSettings.holidayLeadMinutes : 15,
    };
  }

  // Safety Critical Check: Does this file have ANY valid entities?
  const totalValidItems = validTasks.length + validGoals.length + validHabits.length + validCategories.length;
  if (totalValidItems === 0 && !validUserProfile) {
    return {
      isValid: false,
      fatalError: 'هیچ داده معتبری (تسک، هدف، عادت یا دسته) در این فایل یافت نشد. جهت جلوگیری از پاک شدن اطلاعات فعلی شما، بارگذاری متوقف شد.',
      warnings: [],
      counts: {
        categories: 0,
        goals: 0,
        tasks: 0,
        habits: 0,
        corruptedTasks,
        corruptedGoals,
        corruptedHabits,
        corruptedCategories,
      },
      data: null,
    };
  }

  // Populate warnings for non-fatal discarded items
  if (corruptedTasks > 0) {
    warnings.push(`${corruptedTasks} تسک ناقص (فاقد عنوان یا شناسه) نادیده گرفته شد.`);
  }
  if (corruptedGoals > 0) {
    warnings.push(`${corruptedGoals} هدف با ساختار نامعتبر نادیده گرفته شد.`);
  }
  if (corruptedHabits > 0) {
    warnings.push(`${corruptedHabits} عادت با فیلدهای ناقص نادیده گرفته شد.`);
  }
  if (corruptedCategories > 0) {
    warnings.push(`${corruptedCategories} دسته‌بندی مخدوش نادیده گرفته شد.`);
  }

  const exportDateString = parsed.exportPersianDate || (parsed.exportDate ? new Date(parsed.exportDate).toLocaleDateString('fa-IR') : undefined);
  const appName = typeof parsed.appName === 'string' ? parsed.appName : 'جوانه';

  return {
    isValid: true,
    fatalError: null,
    warnings,
    exportDateString,
    appName,
    counts: {
      categories: validCategories.length,
      goals: validGoals.length,
      tasks: validTasks.length,
      habits: validHabits.length,
      corruptedTasks,
      corruptedGoals,
      corruptedHabits,
      corruptedCategories,
    },
    data: {
      categories: validCategories,
      goals: validGoals,
      tasks: validTasks,
      habits: validHabits,
      userProfile: validUserProfile,
      reminderSettings: validReminderSettings,
    },
  };
}

/**
 * Direct array of tasks validation (e.g. for task-only exports)
 */
function validateDirectTasksArray(arr: any[]): ValidatedBackupResult {
  const validTasks: AppTask[] = [];
  let corrupted = 0;

  for (const item of arr) {
    if (item && typeof item === 'object' && typeof item.id === 'string' && item.title) {
      validTasks.push({
        id: String(item.id),
        title: String(item.title),
        isCompleted: Boolean(item.isCompleted),
        categoryId: typeof item.categoryId === 'string' ? item.categoryId : 'cat-work',
        dueDate: typeof item.dueDate === 'string' ? item.dueDate : undefined,
        time: typeof item.time === 'string' ? item.time : undefined,
        priority: (item.priority === 'HIGH' || item.priority === 'MEDIUM' || item.priority === 'LOW') ? item.priority : 'MEDIUM',
        repeatType: (item.repeatType === 'DAILY' || item.repeatType === 'WEEKLY' || item.repeatType === 'NONE') ? item.repeatType : 'NONE',
        repeatDaysOfWeek: Array.isArray(item.repeatDaysOfWeek) ? item.repeatDaysOfWeek : [],
      });
    } else {
      corrupted++;
    }
  }

  if (validTasks.length === 0) {
    return {
      isValid: false,
      fatalError: 'فایل حاوی هیچ تسک معتبری نیست. اطلاعات فعلی شما بدون تغییر حفظ گردید.',
      warnings: [],
      counts: { categories: 0, goals: 0, tasks: 0, habits: 0, corruptedTasks: corrupted, corruptedGoals: 0, corruptedHabits: 0, corruptedCategories: 0 },
      data: null,
    };
  }

  return {
    isValid: true,
    fatalError: null,
    warnings: corrupted > 0 ? [`${corrupted} تسک ناقص در فایل نادیده گرفته شد.`] : [],
    counts: {
      categories: 0,
      goals: 0,
      tasks: validTasks.length,
      habits: 0,
      corruptedTasks: corrupted,
      corruptedGoals: 0,
      corruptedHabits: 0,
      corruptedCategories: 0,
    },
    data: {
      categories: [],
      goals: [],
      tasks: validTasks,
      habits: [],
    },
  };
}
