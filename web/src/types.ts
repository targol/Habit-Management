export type GoalPeriod = 'ANNUAL' | 'SEASONAL' | 'MONTHLY';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface GoalHistoryEntry {
  id: string;
  timestamp: string; // e.g. "1403/07/15 - 14:30"
  action: 'CREATED' | 'EDITED' | 'STATUS_CHANGED' | 'NOTE_ADDED' | 'MILESTONE_COMPLETED';
  description: string;
  previousValues?: {
    title?: string;
    description?: string;
    period?: GoalPeriod;
    status?: GoalStatus;
  };
}

export interface Category {
  id: string;
  title: string;
  colorHex: string;
  iconName: string;
  plantType?: string; // نوع گیاه نمادین این دسته‌بندی
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  visionWhy?: string; // چرا این هدف برای شما مهم است؟
  year: number; // e.g. 1403, 1404
  period: GoalPeriod;
  status: GoalStatus;
  startDate: string; // "1403/07/15" - از همین تاریخ به اهداف فعال اضافه می‌شود
  targetDate?: string;
  seasonIndex?: number; // 0: بهار, 1: تابستان, 2: پاییز, 3: زمستان
  monthIndex?: number; // 1 to 12 (فروردین تا اسفند)
  parentId?: string | null;
  categoryId?: string; // دسته‌بندی موضوعی هدف
  colorHex?: string; // رنگ انتخابی هدف یا دسته‌بندی
  plantType?: string; // نوع گیاه نمادین این هدف
  manualProgress?: number | null; // درصد پیشرفت دستی تعیین‌شده توسط کاربر (۰ تا ۱۰۰)
  isManualProgressActive?: boolean; // آیا پیشرفت دستی ملاک است یا محاسبه خودکار
  history: GoalHistoryEntry[];
  createdAt: string;
}

export type TaskRepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface AppTask {
  id: string;
  title: string;
  notes: string;
  categoryId: string;
  goalId?: string | null;
  dueDate: string; // "1403/07/15" یا خالی برای تسک بدون موعد معین (پیش‌فرض پایان سال)
  time?: string | null; // "14:30" - زمان/ساعت انجام تسک
  deadlineTime?: string | null; // "18:00" - زمان نهایی پایان تسک (اختیاری)
  reminderMinutesBefore?: number | null;
  isImportant?: boolean; // علامت‌گذاری به عنوان تسک مهم
  reminderEnabled?: boolean; // یادآور فعال برای این تسک
  reminderTime?: string | null; // ساعت مشخص یادآور مثلا "14:30"
  reminderDate?: string | null; // تاریخ مشخص یادآور مثلا "1403/07/15"
  customAlarmSound?: string | null; // شناسه زنگ اختصاصی یا پیش‌فرض
  lastNotifiedAt?: string | null; // آخرین زمان ارسال اعلان برای جلوگیری از تکرار
  repeatType: TaskRepeatType;
  repeatDaysOfWeek: number[]; // 0: Saturday .. 6: Friday
  weekOfMonth?: number; // 1 to 5 (هفته اول، دوم، سوم، چهارم، پنجم ماه)
  dayOfWeek?: number; // 0 to 6 (روز شنبه تا جمعه)
  timerSecondsTarget: number;
  timerSecondsElapsed: number;
  isCompleted: boolean;
  completedAt?: string | null;
  isArchived?: boolean; // آیا به بخش بایگانی منتقل شده است
}

export type HabitFrequency = 'DAILY' | 'WEEKLY';

export interface Habit {
  id: string;
  title: string;
  notes: string;
  categoryId: string;
  goalId?: string | null;
  time?: string | null;
  timerMinutes: number;
  frequency: HabitFrequency;
  targetDaysOfWeek: number[];
  exemptHolidays: boolean;
  exemptWeekends: boolean;
  plantType: string;
  completionHistory: Record<string, boolean>; // "1403/07/15": true
  createdAt: string;
  isClosed?: boolean; // آیا عادت خاتمه یافته و از لیست فعال بسته شده است؟ (تاریخچه حفظ می‌شود)
  closedAt?: string | null; // تاریخ بسته شدن
}

export interface PlantState {
  stage: 'SEED' | 'SPROUT' | 'SAPLING' | 'BUDDING' | 'FLOWERING' | 'FULL_BLOOM';
  progressPercent: number;
  completedCount: number;
  totalCount: number;
}

export interface UserProfile {
  name: string;
  title?: string;
  avatarUrl?: string; // تصویر بارگذاری‌شده (Base64) یا آیکون گیاه برگزیده
  bio?: string;
}

export interface AlarmSoundItem {
  id: string;
  title: string;
  description: string;
  category: 'calm' | 'nature' | 'chime' | 'zen' | 'custom';
  type: 'synth' | 'audio';
  audioData?: string; // Base64 data URI for user uploaded files
  synthPattern?: string; // For built-in high-res procedural audio
  durationSeconds?: number;
}

export interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  selectedSoundId: string;
  volume: number; // 0.1 to 1.0
  customSounds: AlarmSoundItem[];
}

export interface AppBackupData {
  appName: string;
  version: string;
  exportDate: string;
  exportPersianDate?: string;
  userProfile?: UserProfile;
  reminderSettings?: ReminderSettings;
  counts?: {
    categories: number;
    goals: number;
    tasks: number;
    habits: number;
  };
  categories: Category[];
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
}
