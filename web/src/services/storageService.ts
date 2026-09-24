import { AppTask, Category, Goal, Habit, UserProfile, ReminderSettings } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';

export interface AppDataPayload {
  categories: Category[];
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  userProfile?: UserProfile;
  reminderSettings?: ReminderSettings;
  initialized?: boolean;
  lastUpdated?: number;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'باغبان جوانه',
  title: 'در مسیر رشد و پویایی',
  avatarUrl: '🌱',
  bio: 'هر روز با مراقبت از عادت‌ها و وظایف کوچک، اهداف بزرگ سالانه‌ام را به بار می‌نشانم.',
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  soundEnabled: true,
  selectedSoundId: 'serenity',
  volume: 0.8,
  customSounds: [],
  snoozeIntervalMinutes: 10,
  availableSnoozeIntervals: [5, 10, 15, 30, 60],
  autoReNotifyCount: 2,
  autoReNotifyIntervalMinutes: 10,
  notifyBeforeHolidayTasks: true,
  holidayLeadMinutes: 15,
};

export const STORAGE_KEYS = {
  CATEGORIES: 'javaneh_categories',
  GOALS: 'javaneh_goals',
  TASKS: 'javaneh_tasks',
  HABITS: 'javaneh_habits',
  USER_PROFILE: 'javaneh_user_profile',
  PROFILE: 'javaneh_user_profile',
  REMINDER_SETTINGS: 'javaneh_reminder_settings',
  REMINDERS: 'javaneh_reminder_settings',
  INITIALIZED: 'javaneh_initialized',
  LAST_SYNC: 'javaneh_last_sync',
  USER_ID: 'javaneh_user_uuid',
  APP_VERSION: 'javaneh_installed_version',
  PRE_UPDATE_BACKUP: 'javaneh_pre_update_backup',
};

// Generates or retrieves the unique isolated device user ID
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'device-isolated-user';
  try {
    let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.USER_ID, id);
    }
    return id;
  } catch {
    return 'device-isolated-user';
  }
}


const IDB_NAME = 'JavanehDB';
const IDB_STORE = 'app_data';

// --- Helpers for Safe Hydration & Merge ---
export function mergeEntitiesById<T extends { id: string }>(...lists: (T[] | null | undefined)[]): T[] {
  const map = new Map<string, T>();
  // Process lists from earliest (lowest priority) to latest (highest priority)
  for (const list of lists) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && typeof item === 'object' && item.id) {
          map.set(item.id, { ...(map.get(item.id) || {}), ...item });
        }
      }
    }
  }
  return Array.from(map.values());
}

// Backup snapshot to prevent any data loss
const SNAPSHOT_KEY = 'javaneh_backup_snapshot';

export function saveLocalSnapshot(data: AppDataPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem(SNAPSHOT_KEY);
    let historySnapshots: Array<{ timestamp: number; payload: AppDataPayload }> = [];
    if (existingRaw) {
      try {
        historySnapshots = JSON.parse(existingRaw);
      } catch {}
    }
    // Only save snapshot if it has meaningful content
    const hasContent = (data.goals && data.goals.length > 0) || (data.tasks && data.tasks.length > 0) || (data.habits && data.habits.length > 0) || Boolean(data.userProfile?.name);
    if (hasContent) {
      historySnapshots.unshift({
        timestamp: Date.now(),
        payload: {
          categories: data.categories || [],
          goals: data.goals || [],
          tasks: data.tasks || [],
          habits: data.habits || [],
          userProfile: data.userProfile,
          reminderSettings: data.reminderSettings,
        },
      });
      // Keep last 10 snapshots
      historySnapshots = historySnapshots.slice(0, 10);
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(historySnapshots));
    }
  } catch (e) {
    console.warn('Failed to save local snapshot:', e);
  }
}

export function resetLocalSnapshotsWithData(data: AppDataPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const historySnapshots = [{
      timestamp: Date.now(),
      payload: {
        categories: data.categories || [],
        goals: data.goals || [],
        tasks: data.tasks || [],
        habits: data.habits || [],
        userProfile: data.userProfile,
        reminderSettings: data.reminderSettings,
      },
    }];
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(historySnapshots));
  } catch (e) {
    console.warn('Failed to reset local snapshots:', e);
  }
}

export function getLocalSnapshots(): Array<{ timestamp: number; payload: AppDataPayload }> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Deep recovery across all available local stores
export async function recoverAllLocalData(): Promise<AppDataPayload> {
  const idbCats = await loadFromIndexedDB<Category[]>('categories');
  const idbGoals = await loadFromIndexedDB<Goal[]>('goals');
  const idbTasks = await loadFromIndexedDB<AppTask[]>('tasks');
  const idbHabits = await loadFromIndexedDB<Habit[]>('habits');

  const lsCats = loadFromLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const lsGoals = loadFromLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const lsTasks = loadFromLocalStorage<AppTask[]>(STORAGE_KEYS.TASKS, []);
  const lsHabits = loadFromLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);

  // Also check snapshots
  const snapshots = getLocalSnapshots();
  const snapGoals = snapshots.flatMap(s => s.payload.goals || []);
  const snapTasks = snapshots.flatMap(s => s.payload.tasks || []);
  const snapHabits = snapshots.flatMap(s => s.payload.habits || []);

  const mergedCategories = mergeEntitiesById(INITIAL_CATEGORIES, idbCats, lsCats);
  const mergedGoals = mergeEntitiesById(snapGoals, idbGoals, lsGoals);
  const mergedTasks = mergeEntitiesById(snapTasks, idbTasks, lsTasks);
  const mergedHabits = mergeEntitiesById(snapHabits, idbHabits, lsHabits);

  return {
    categories: mergedCategories,
    goals: mergedGoals,
    tasks: mergedTasks,
    habits: mergedHabits,
    initialized: true,
  };
}
function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB open failed, fallback to localStorage only');
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB not supported or accessible', e);
      resolve(null);
    }
  });
}

export async function saveToIndexedDB(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadFromIndexedDB<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// --- LocalStorage Helpers ---
export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.warn(`Failed reading localStorage key "${key}"`, e);
  }
  return fallback;
}

export function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed writing localStorage key "${key}"`, e);
  }
}

// --- Server API Sync with Debouncing ---
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerServerSync(data: AppDataPayload, delayMs: number = 600): void {
  // Always create snapshot locally immediately
  saveLocalSnapshot(data);

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    try {
      const userId = getOrCreateUserId();
      const payload = {
        ...data,
        userId,
        initialized: true,
        lastUpdated: Date.now(),
      };
      await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-User-Id': userId,
        },
        body: JSON.stringify(payload),
      });
      saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
    } catch (err) {
      console.warn('Background server sync paused (will retry next change):', err);
    }
  }, delayMs);
}

// Fetch from server API
export async function fetchServerData(): Promise<AppDataPayload | null> {
  try {
    const userId = getOrCreateUserId();
    const res = await fetch(`/api/data?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return data as AppDataPayload;
      }
    }
  } catch (e) {
    console.info('Server storage API not accessible or offline, using local storage.');
  }
  return null;
}

// Safe Pre-Update Storage Check and Emergency Snapshot
export interface PreUpdateBackupResult {
  success: boolean;
  timestamp: number;
  data: AppDataPayload;
  downloadedFile?: boolean;
}

export function savePreUpdateBackup(data: AppDataPayload): PreUpdateBackupResult {
  const timestamp = Date.now();
  saveLocalSnapshot(data);
  try {
    localStorage.setItem(STORAGE_KEYS.PRE_UPDATE_BACKUP, JSON.stringify({
      timestamp,
      data,
    }));
  } catch (e) {
    console.warn('Could not save pre-update backup to localStorage:', e);
  }
  return {
    success: true,
    timestamp,
    data,
  };
}

export function getPreUpdateBackup(): { timestamp: number; data: AppDataPayload } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRE_UPDATE_BACKUP);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

