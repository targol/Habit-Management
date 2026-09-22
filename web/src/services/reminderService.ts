import { AppTask, ReminderSettings, AlarmSoundItem } from '../types';
import { playAlarmSound } from './soundService';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Dispatches a native browser notification if granted
 */
export function sendBrowserNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  } = {}
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options.body || 'زمان رسیدگی به این تسک مهم فرا رسیده است.',
      icon: options.icon || '/favicon.ico',
      tag: options.tag || `javaneh-task-${Date.now()}`,
      badge: '/favicon.ico',
      dir: 'rtl',
      lang: 'fa',
      requireInteraction: true,
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    return notification;
  } catch (err) {
    console.error('Browser notification could not be created:', err);
    return null;
  }
}

/**
 * Computes exact reminder HH:mm for a task
 */
export function getTaskEffectiveReminderTime(task: AppTask): string | null {
  if (task.reminderTime) {
    return task.reminderTime;
  }

  if (task.time) {
    if (task.reminderMinutesBefore && task.reminderMinutesBefore > 0) {
      const [hStr, mStr] = task.time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        let totalMin = h * 60 + m - task.reminderMinutesBefore;
        if (totalMin < 0) totalMin += 24 * 60; // wrap around day boundary
        const remH = Math.floor(totalMin / 60);
        const remM = totalMin % 60;
        return `${remH.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}`;
      }
    }
    return task.time;
  }

  return null;
}

/**
 * Determines if a task reminder is due right now
 */
export function isTaskReminderDue(
  task: AppTask,
  currentJalaliDate: string, // e.g. "1405/01/01"
  currentTimeHHMM: string,   // e.g. "10:30"
  currentDayOfWeek: number   // 0=Saturday .. 6=Friday
): boolean {
  if (task.isCompleted) return false;

  const isReminderActive = task.reminderEnabled || task.isImportant;
  if (!isReminderActive) return false;

  const targetTime = getTaskEffectiveReminderTime(task);
  if (!targetTime) return false;

  // Check date matching
  let dateMatches = false;
  if (task.reminderDate) {
    dateMatches = task.reminderDate === currentJalaliDate;
  } else if (task.dueDate) {
    dateMatches = task.dueDate === currentJalaliDate;
  } else if (task.repeatType === 'DAILY') {
    dateMatches = true;
  } else if (task.repeatType === 'WEEKLY') {
    dateMatches = Array.isArray(task.repeatDaysOfWeek) && task.repeatDaysOfWeek.includes(currentDayOfWeek);
  } else {
    // Undated tasks don't fire without an explicit reminderDate
    return false;
  }

  if (!dateMatches) return false;

  // Check time matching
  if (targetTime !== currentTimeHHMM) return false;

  // Check if already notified for this exact date & time slot
  const slotKey = `${currentJalaliDate} ${currentTimeHHMM}`;
  if (task.lastNotifiedAt === slotKey) {
    return false;
  }

  return true;
}

/**
 * Fires reminder: Browser notification + gentle audio alarm
 */
export function triggerReminderAlarm(
  task: AppTask,
  settings: ReminderSettings,
  onTaskClick?: () => void
): () => void {
  // 1. Audio Alarm
  let stopAudio: () => void = () => {};
  if (settings.soundEnabled) {
    const soundIdToPlay = task.customAlarmSound || settings.selectedSoundId || 'serenity';
    stopAudio = playAlarmSound(soundIdToPlay, settings.customSounds || [], settings.volume);
  }

  // 2. Browser Native Notification
  sendBrowserNotification(`یادآور جوانه: ${task.title}`, {
    body: task.notes ? `${task.notes}\nزمان: ${task.time || ''}` : `موعد این تسک مهم فرا رسیده است.`,
    tag: `task-${task.id}`,
    onClick: onTaskClick,
  });

  return stopAudio;
}
