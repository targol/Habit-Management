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
  plantType?: string; // نوع گیاه نمادین این هدف
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
  dueDate: string; // "1403/07/15"
  time?: string | null; // "14:30"
  reminderMinutesBefore?: number | null;
  repeatType: TaskRepeatType;
  repeatDaysOfWeek: number[]; // 0: Saturday .. 6: Friday
  weekOfMonth?: number; // 1 to 5 (هفته اول، دوم، سوم، چهارم، پنجم ماه)
  dayOfWeek?: number; // 0 to 6 (روز شنبه تا جمعه)
  timerSecondsTarget: number;
  timerSecondsElapsed: number;
  isCompleted: boolean;
  completedAt?: string | null;
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
}

export interface PlantState {
  stage: 'SEED' | 'SPROUT' | 'SAPLING' | 'BUDDING' | 'FLOWERING' | 'FULL_BLOOM';
  progressPercent: number;
  completedCount: number;
  totalCount: number;
}
