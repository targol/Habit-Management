import React, { useState, useRef, useEffect } from 'react';
import { Category, Goal, AppTask, Habit, AppBackupData, UserProfile, ReminderSettings, AlarmSoundItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';
import { toPersianDigits, getTodayJalali, getCurrentPersianDateTimeString } from '../calendar/jalali';
import { PRESET_ALARM_SOUNDS, previewSound, stopAllAlarmSounds, playAlarmSound } from '../services/soundService';
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission, sendBrowserNotification } from '../services/reminderService';
import { DEFAULT_USER_PROFILE, DEFAULT_REMINDER_SETTINGS, getOrCreateUserId } from '../services/storageService';
import { UserProfileSettings } from './UserProfileSettings';
import { ReminderAlarmSettings } from './ReminderAlarmSettings';
import { ApkIntegrityModal } from './ApkIntegrityModal';
import { UpdateAndBackupModal } from './UpdateAndBackupModal';
import { MobileInstallModal } from './MobileInstallModal';
import { APP_VERSION_INFO } from '../version';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  Tag, 
  Sprout, 
  Palette, 
  Download, 
  Upload, 
  Calendar, 
  Info,
  Briefcase,
  BookOpen,
  HeartPulse,
  Home,
  Compass,
  DollarSign,
  Dumbbell,
  GraduationCap,
  Code,
  Sparkles,
  Coffee,
  Music,
  Smile,
  Sun,
  Heart,
  Target,
  Database,
  ShieldCheck,
  HardDrive,
  Copy,
  FileText,
  AlertTriangle,
  FileUp,
  CheckCircle2,
  Layers,
  ArrowRight,
  User,
  Camera,
  Bell,
  Volume2,
  Play,
  Square,
  Music2,
  FileAudio,
  Sliders,
  Image as ImageIcon,
  Star,
  Smartphone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  QrCode,
  Share2,
  Moon,
  Monitor,
  Flame,
  Vibrate,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Clock
} from 'lucide-react';

export type SettingsTabId = 'PROFILE' | 'REMINDERS' | 'THEMES' | 'CATEGORIES' | 'DATA' | 'MOBILE' | 'ALL';

interface Props {
  categories: Category[];
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  userProfile?: UserProfile;
  reminderSettings?: ReminderSettings;
  deferredPrompt?: any;
  onInstallClick?: () => void;
  onSaveUserProfile?: (profile: UserProfile) => void;
  onSaveReminderSettings?: (settings: ReminderSettings) => void;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategories: () => void;
  onImportTasksOnly?: (tasks: AppTask[], mode: 'REPLACE' | 'MERGE') => void;
  onImportAllData?: (
    data: {
      categories: Category[];
      goals: Goal[];
      tasks: AppTask[];
      habits: Habit[];
      userProfile?: UserProfile;
      reminderSettings?: ReminderSettings;
    },
    mode?: 'REPLACE' | 'MERGE'
  ) => void;
}

export interface ColorThemeItem {
  id: string;
  name: string;
  subtitle: string;
  primaryHex: string;
  accentHex: string;
  gradientHeader: string;
  badgeClass: string;
  activeRing: string;
  emoji: string;
  description: string;
}

export const THEME_PALETTES: ColorThemeItem[] = [
  {
    id: 'emerald',
    name: 'زمردی جوانه',
    subtitle: 'رویش، طبیعت و نشاط بهاری (پیش‌فرض)',
    primaryHex: '#10B981',
    accentHex: '#059669',
    gradientHeader: 'from-emerald-900 via-emerald-800 to-teal-900',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeRing: 'ring-emerald-500',
    emoji: '🌱',
    description: 'تم اصیل و امضای تصویری برنامه جوانه، نماد رشد مداوم و انگیزه روزانه'
  },
  {
    id: 'teal',
    name: 'فیروزه‌ای خلیج',
    subtitle: 'آرامش اقیانوس و زلالی ذهن',
    primaryHex: '#0D9488',
    accentHex: '#06B6D4',
    gradientHeader: 'from-teal-900 via-teal-800 to-cyan-900',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    activeRing: 'ring-teal-500',
    emoji: '🌊',
    description: 'رنگ‌های خنک و آرام‌بخش برای تمرکز عمیق، کاهش اضطراب و آرامش کارها'
  },
  {
    id: 'blue',
    name: 'آبی آسمان',
    subtitle: 'افق روشن و انگیزه پایدار',
    primaryHex: '#2563EB',
    accentHex: '#3B82F6',
    gradientHeader: 'from-blue-900 via-blue-800 to-indigo-900',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    activeRing: 'ring-blue-500',
    emoji: '☁️',
    description: 'رنگ کلاسیک برنامه‌ریزی حرفه‌ای، بهره‌وری اداری و نظم ذهنی دقیق'
  },
  {
    id: 'indigo',
    name: 'نیلی شبانه',
    subtitle: 'تمرکز عمیق و تفکر هوشمندانه',
    primaryHex: '#4F46E5',
    accentHex: '#6366F1',
    gradientHeader: 'from-indigo-950 via-indigo-900 to-purple-950',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    activeRing: 'ring-indigo-500',
    emoji: '🌌',
    description: 'رنگ مدرن و متمرکز، مناسب ساعت‌های مطالعه، پژوهش و غرقگی فکری'
  },
  {
    id: 'purple',
    name: 'بنفش ارکیده',
    subtitle: 'خلاقیت، نوآوری و شکوه بصری',
    primaryHex: '#9333EA',
    accentHex: '#A855F7',
    gradientHeader: 'from-purple-950 via-purple-900 to-fuchsia-950',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    activeRing: 'ring-purple-500',
    emoji: '🌸',
    description: 'الهام‌بخش رویاهای بزرگ، تقویت قوه تجسم و طراحی اهداف هنری و خلاقانه'
  },
  {
    id: 'amber',
    name: 'کهربایی غروب',
    subtitle: 'گرمای آفتاب، شور و انرژی روزانه',
    primaryHex: '#D97706',
    accentHex: '#F59E0B',
    gradientHeader: 'from-amber-950 via-amber-800 to-orange-950',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeRing: 'ring-amber-500',
    emoji: '☀️',
    description: 'رنگ خورشید و گرما، تقویت اراده برای آغاز صبح‌های پرانرژی و متعهدانه'
  },
  {
    id: 'rose',
    name: 'یاقوتی گل سرخ',
    subtitle: 'عشق به اهداف و اشتیاق آتشین',
    primaryHex: '#E11D48',
    accentHex: '#F43F5E',
    gradientHeader: 'from-rose-950 via-rose-900 to-pink-950',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    activeRing: 'ring-rose-500',
    emoji: '🌹',
    description: 'پرشور و چشم‌گیر، مناسب ایجاد تحول و انرژی مضاعف در پیگیری پروژه‌ها'
  },
  {
    id: 'slate',
    name: 'سنگی مینیمال',
    subtitle: 'سکوت بصری و سادگی مدرن',
    primaryHex: '#475569',
    accentHex: '#64748B',
    gradientHeader: 'from-slate-900 via-slate-800 to-zinc-900',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    activeRing: 'ring-slate-500',
    emoji: '🪨',
    description: 'بدون شلوغی و حواس‌پرتی، انتخابی ایده‌آل برای طرفداران مینیمالیسم خالص'
  }
];

const PRESET_COLORS = [
  { hex: '#10B981', label: 'زمردی' },
  { hex: '#0D9488', label: 'سبز کله‌غازی' },
  { hex: '#3B82F6', label: 'آبی روشن' },
  { hex: '#6366F1', label: 'نیلی' },
  { hex: '#8B5CF6', label: 'بنفش' },
  { hex: '#EC4899', label: 'صورتی' },
  { hex: '#EF4444', label: 'یاقوتی' },
  { hex: '#F59E0B', label: 'کهربایی' },
  { hex: '#D97706', label: 'نارنجی خاکی' },
  { hex: '#84CC16', label: 'لیمویی شاد' },
  { hex: '#06B6D4', label: 'فیروزه‌ای' },
  { hex: '#64748B', label: 'خاکستری مدرن' },
];

const AVAILABLE_ICONS = [
  { name: 'Briefcase', label: 'کار و کسب', icon: Briefcase },
  { name: 'BookOpen', label: 'یادگیری و کتاب', icon: BookOpen },
  { name: 'HeartPulse', label: 'سلامتی و ورزش', icon: HeartPulse },
  { name: 'Home', label: 'خانه و خانواده', icon: Home },
  { name: 'Compass', label: 'مسیر و هدف', icon: Compass },
  { name: 'DollarSign', label: 'مالی و درآمد', icon: DollarSign },
  { name: 'Dumbbell', label: 'بدنسازی و تمرین', icon: Dumbbell },
  { name: 'GraduationCap', label: 'دانشگاه و تحصیل', icon: GraduationCap },
  { name: 'Code', label: 'برنامه‌نویسی و آی‌تی', icon: Code },
  { name: 'Palette', label: 'هنر و خلاقیت', icon: Palette },
  { name: 'Coffee', label: 'سبک زندگی و استراحت', icon: Coffee },
  { name: 'Sparkles', label: 'رشد و معنویت', icon: Sparkles },
  { name: 'Music', label: 'موسیقی و هنر', icon: Music },
  { name: 'Smile', label: 'انرژی و روابط', icon: Smile },
  { name: 'Sun', label: 'انگیزه و نشاط', icon: Sun },
  { name: 'Heart', label: 'عشق و پیوندها', icon: Heart },
];

export const SettingsScreen: React.FC<Props> = ({
  categories,
  goals,
  tasks,
  habits,
  userProfile,
  reminderSettings,
  deferredPrompt,
  onInstallClick,
  onSaveUserProfile,
  onSaveReminderSettings,
  onSaveCategory,
  onDeleteCategory,
  onResetCategories,
  onImportTasksOnly,
  onImportAllData,
}) => {
  // Active Navigation Tab for Settings Menu (Default: PROFILE on initial view or restored from localStorage)
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    try {
      const saved = localStorage.getItem('javaneh_settings_active_tab') as SettingsTabId;
      if (['PROFILE', 'REMINDERS', 'THEMES', 'CATEGORIES', 'DATA', 'MOBILE', 'ALL'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'PROFILE';
  });

  // Color Theme State
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    return userProfile?.themeColor || localStorage.getItem('javaneh_theme_color') || 'emerald';
  });

  // Appearance & Display Preferences
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return userProfile?.darkMode ?? (localStorage.getItem('javaneh_dark_mode') === 'true');
  });
  const [enablePlantAnimations, setEnablePlantAnimations] = useState<boolean>(() => {
    return localStorage.getItem('javaneh_plant_animations') !== 'false';
  });
  const [enableHapticFeedback, setEnableHapticFeedback] = useState<boolean>(() => {
    return localStorage.getItem('javaneh_haptic_feedback') !== 'false';
  });

  // Modal / Form state for Category add/edit
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [catTitle, setCatTitle] = useState('');
  const [catColor, setCatColor] = useState('#10B981');
  const [catPlantType, setCatPlantType] = useState('بونسای');
  const [catIconName, setCatIconName] = useState('Briefcase');

  // Status message for actions
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Mobile Install & Troubleshooting guide toggle
  const [isMobileInstallModalOpen, setIsMobileInstallModalOpen] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showApkDetails, setShowApkDetails] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isUpdateAndBackupModalOpen, setIsUpdateAndBackupModalOpen] = useState(false);

  // In-app category deletion confirmation modal state
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    title: string;
    linkedGoalsCount: number;
    linkedTasksCount: number;
    linkedHabitsCount: number;
  } | null>(null);

  // Restore Modal State
  const [restoreModal, setRestoreModal] = useState<{
    isOpen: boolean;
    fileName: string;
    fileSizeKb: number;
    exportDate: string;
    data: {
      categories: Category[];
      goals: Goal[];
      tasks: AppTask[];
      habits: Habit[];
      userProfile?: UserProfile;
      reminderSettings?: ReminderSettings;
    };
    counts: {
      categories: number;
      goals: number;
      tasks: number;
      habits: number;
    };
    mode: 'REPLACE' | 'MERGE';
    autoBackupBeforeRestore: boolean;
  } | null>(null);

  const [isTextPasteModalOpen, setIsTextPasteModalOpen] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [isCopyingJson, setIsCopyingJson] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Tab Change with persistence
  const handleTabChange = (tab: SettingsTabId) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('javaneh_settings_active_tab', tab);
    } catch {}
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Sync theme to DOM and UserProfile
  const handleApplyTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    try {
      localStorage.setItem('javaneh_theme_color', themeId);
      document.documentElement.setAttribute('data-app-theme', themeId);
    } catch {}

    if (onSaveUserProfile) {
      const current = userProfile || DEFAULT_USER_PROFILE;
      onSaveUserProfile({
        ...current,
        themeColor: themeId,
        darkMode: isDarkMode,
      });
    }

    const matched = THEME_PALETTES.find(t => t.id === themeId);
    showNotification(`تم «${matched ? matched.name : themeId}» با موفقیت فعال و ذخیره شد.`);
  };

  const handleToggleDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    try {
      localStorage.setItem('javaneh_dark_mode', dark ? 'true' : 'false');
      document.documentElement.classList.toggle('dark', dark);
    } catch {}

    if (onSaveUserProfile) {
      const current = userProfile || DEFAULT_USER_PROFILE;
      onSaveUserProfile({
        ...current,
        darkMode: dark,
        themeColor: selectedThemeId,
      });
    }
    showNotification(dark ? 'حالت شب (تیره) فعال شد.' : 'حالت روز (روشن) فعال شد.');
  };

  const handleTogglePlantAnimations = (enabled: boolean) => {
    setEnablePlantAnimations(enabled);
    try {
      localStorage.setItem('javaneh_plant_animations', enabled ? 'true' : 'false');
    } catch {}
    showNotification(enabled ? 'انیمیشن‌های رشد گیاهان فعال شدند.' : 'انیمیشن‌ها برای صرفه‌جویی در باتری غیرفعال شدند.');
  };

  const handleToggleHaptic = (enabled: boolean) => {
    setEnableHapticFeedback(enabled);
    try {
      localStorage.setItem('javaneh_haptic_feedback', enabled ? 'true' : 'false');
      if (enabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {}
    showNotification(enabled ? 'بازخورد لمسی (ویبره کوتاه) فعال شد.' : 'بازخورد لمسی غیرفعال شد.');
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatTitle('');
    setCatColor(PRESET_COLORS[0].hex);
    setCatPlantType(ALL_PLANT_TYPES[0].id);
    setCatIconName('Briefcase');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatTitle(cat.title);
    setCatColor(cat.colorHex || '#10B981');
    setCatPlantType(cat.plantType || ALL_PLANT_TYPES[0].id);
    setCatIconName(cat.iconName || 'Briefcase');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle.trim()) return;

    const categoryToSave: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      title: catTitle.trim(),
      colorHex: catColor,
      plantType: catPlantType,
      iconName: catIconName,
    };

    onSaveCategory(categoryToSave);
    setIsCategoryModalOpen(false);
    showNotification(editingCategory ? 'دسته‌بندی با موفقیت ویرایش شد' : 'دسته‌بندی جدید با موفقیت اضافه شد');
  };

  const handleDeleteCategoryClick = (catId: string, title: string) => {
    if (categories.length <= 1) {
      showNotification('حداقل یک دسته‌بندی باید در برنامه وجود داشته باشد.');
      return;
    }
    const linkedGoalsCount = goals.filter(g => g.categoryId === catId).length;
    const linkedTasksCount = tasks.filter(t => t.categoryId === catId).length;
    const linkedHabitsCount = habits.filter(h => h.categoryId === catId).length;

    setCategoryToDelete({
      id: catId,
      title,
      linkedGoalsCount,
      linkedTasksCount,
      linkedHabitsCount,
    });
  };

  // 1. Export JSON with durable Blob download and Jalali formatted filename
  const handleExportData = () => {
    try {
      const todayJ = getTodayJalali();
      const datePart = `${todayJ.year}-${String(todayJ.month).padStart(2, '0')}-${String(todayJ.day).padStart(2, '0')}`;
      const backup: AppBackupData = {
        appName: 'جوانه (Javaneh)',
        version: '1.3.0',
        exportDate: new Date().toISOString(),
        exportPersianDate: getCurrentPersianDateTimeString(),
        counts: {
          categories: categories.length,
          goals: goals.length,
          tasks: tasks.length,
          habits: habits.length,
        },
        categories,
        goals,
        tasks,
        habits,
        userProfile,
        reminderSettings,
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `javaneh-backup-${datePart}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showNotification('نسخه پشتیبان کامل برنامه (JSON) با موفقیت دانلود و ذخیره شد.');
    } catch (err) {
      console.error('Export failed:', err);
      showNotification('خطا در تولید فایل پشتیبان.');
    }
  };

  // 2. Copy JSON string directly to Clipboard
  const handleCopyJsonToClipboard = async () => {
    try {
      const backup: AppBackupData = {
        appName: 'جوانه (Javaneh)',
        version: '1.3.0',
        exportDate: new Date().toISOString(),
        exportPersianDate: getCurrentPersianDateTimeString(),
        counts: {
          categories: categories.length,
          goals: goals.length,
          tasks: tasks.length,
          habits: habits.length,
        },
        categories,
        goals,
        tasks,
        habits,
        userProfile,
        reminderSettings,
      };

      await navigator.clipboard.writeText(JSON.stringify(backup, null, 2));
      setIsCopyingJson(true);
      setTimeout(() => setIsCopyingJson(false), 2500);
      showNotification('متن کامل نسخه پشتیبان (JSON) در حافظه موقت (Clipboard) کپی شد.');
    } catch (err) {
      showNotification('خطا در کپی داده‌ها به کلیپ‌بورد.');
    }
  };

  // 3. Parser & Validator for JSON Backup
  const parseAndPrepareBackup = (rawContent: string, fileName = 'داده‌های پشتیبان', fileSizeKb = 0): boolean => {
    try {
      const parsed = JSON.parse(rawContent);
      const root = parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

      const importedCategories: Category[] = Array.isArray(root.categories) ? root.categories : [];
      const importedGoals: Goal[] = Array.isArray(root.goals) ? root.goals : [];
      const importedTasks: AppTask[] = Array.isArray(root.tasks) ? root.tasks : [];
      const importedHabits: Habit[] = Array.isArray(root.habits) ? root.habits : [];
      const importedUserProfile: UserProfile | undefined = root.userProfile;
      const importedReminderSettings: ReminderSettings | undefined = root.reminderSettings;

      if (
        importedCategories.length === 0 &&
        importedGoals.length === 0 &&
        importedTasks.length === 0 &&
        importedHabits.length === 0 &&
        !importedUserProfile
      ) {
        showNotification('خطا: هیچ داده معتبری (هدف، تسک، عادت یا دسته‌بندی) در این فایل یافت نشد.');
        return false;
      }

      let dateLabel = parsed.exportPersianDate;
      if (!dateLabel && parsed.exportDate) {
        try {
          dateLabel = new Date(parsed.exportDate).toLocaleDateString('fa-IR');
        } catch {}
      }

      setRestoreModal({
        isOpen: true,
        fileName,
        fileSizeKb: fileSizeKb || Math.max(1, Math.round(new Blob([rawContent]).size / 1024)),
        exportDate: dateLabel || 'نامشخص',
        data: {
          categories: importedCategories,
          goals: importedGoals,
          tasks: importedTasks,
          habits: importedHabits,
          userProfile: importedUserProfile,
          reminderSettings: importedReminderSettings,
        },
        counts: {
          categories: importedCategories.length,
          goals: importedGoals.length,
          tasks: importedTasks.length,
          habits: importedHabits.length,
        },
        mode: 'MERGE',
        autoBackupBeforeRestore: true,
      });

      return true;
    } catch (err) {
      showNotification('خطا در خواندن: متن یا فایل وارد شده ساختار استاندارد JSON ندارد.');
      return false;
    }
  };

  // 4. File input change
  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      parseAndPrepareBackup(content, file.name, sizeKb);
    };
    reader.onerror = () => {
      showNotification('خطا در خواندن فایل از حافظه دستگاه.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  // 5. Confirm Restore Execution
  const handleConfirmRestore = () => {
    if (!restoreModal || !onImportAllData) return;

    if (restoreModal.autoBackupBeforeRestore) {
      handleExportData();
    }

    onImportAllData(restoreModal.data, restoreModal.mode);

    const modeText = restoreModal.mode === 'REPLACE' ? 'جایگزینی کامل' : 'ترکیب و ادغام';
    showNotification(`اطلاعات با موفقیت به شیوه «${modeText}» بازیابی شدند.`);
    setRestoreModal(null);
  };

  // 6. Text Paste Submission
  const handleTextPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJsonInput.trim()) {
      showNotification('لطفاً متن JSON نسخه پشتیبان را وارد کنید.');
      return;
    }
    const success = parseAndPrepareBackup(rawJsonInput.trim(), 'ورودی متنی دستی');
    if (success) {
      setIsTextPasteModalOpen(false);
      setRawJsonInput('');
    }
  };

  // Render Category Icon dynamically
  const renderIcon = (name: string, className = 'w-4 h-4') => {
    const found = AVAILABLE_ICONS.find(i => i.name === name);
    if (!found) return <Briefcase className={className} />;
    const IconComp = found.icon;
    return <IconComp className={className} />;
  };

  const currentProfile = userProfile || DEFAULT_USER_PROFILE;
  const activeTheme = THEME_PALETTES.find(t => t.id === selectedThemeId) || THEME_PALETTES[0];

  // Settings Menu Navigation Items
  const menuItems = [
    {
      id: 'PROFILE' as SettingsTabId,
      label: 'پروفایل کاربری',
      shortLabel: 'پروفایل',
      icon: User,
      badge: currentProfile.name || 'باغبان',
      colorClass: 'emerald'
    },
    {
      id: 'REMINDERS' as SettingsTabId,
      label: 'تنظیمات یادآور و صدا',
      shortLabel: 'یادآورها',
      icon: Bell,
      badge: reminderSettings?.enabled ? 'فعال' : 'خاموش',
      colorClass: 'amber'
    },
    {
      id: 'THEMES' as SettingsTabId,
      label: 'تم‌های رنگی و ظاهر',
      shortLabel: 'تم‌های رنگی',
      icon: Palette,
      badge: activeTheme.name.split(' ')[0],
      colorClass: 'purple'
    },
    {
      id: 'CATEGORIES' as SettingsTabId,
      label: 'دسته‌ها و گیاهان',
      shortLabel: 'دسته‌بندی‌ها',
      icon: Tag,
      badge: `${toPersianDigits(categories.length)} دسته`,
      colorClass: 'teal'
    },
    {
      id: 'DATA' as SettingsTabId,
      label: 'مدیریت داده‌ها و ذخیره‌سازی',
      shortLabel: 'مدیریت داده‌ها',
      icon: Database,
      badge: `${toPersianDigits(goals.length + tasks.length + habits.length)} رکورد`,
      colorClass: 'blue'
    },
    {
      id: 'MOBILE' as SettingsTabId,
      label: 'نصب اپلیکیشن در گوشی',
      shortLabel: 'نصب موبایل',
      icon: Smartphone,
      badge: 'نسخه رسمی',
      colorClass: 'green'
    },
    {
      id: 'ALL' as SettingsTabId,
      label: 'نمایش یکپارچه (همه بخش‌ها)',
      shortLabel: 'همه بخش‌ها',
      icon: Layers,
      badge: 'کامل',
      colorClass: 'gray'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Sticky Top Header Banner with User Profile Summary */}
      <div className="sticky -top-5 z-20 pt-5 pb-2.5 bg-[#F8F9F5]/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className={`bg-gradient-to-l ${activeTheme.gradientHeader} text-white rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-300`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Profile Avatar / Botanical Badge */}
              <div 
                onClick={() => handleTabChange('PROFILE')}
                className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25 shadow-inner cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0 overflow-hidden"
                title="مشاهده و ویرایش پروفایل"
              >
                {currentProfile.avatarUrl && (currentProfile.avatarUrl.startsWith('data:image') || currentProfile.avatarUrl.startsWith('http')) ? (
                  <img src={currentProfile.avatarUrl} alt="پروفایل" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl select-none">{currentProfile.avatarUrl || '🌱'}</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{currentProfile.name || 'باغبان جوانه'}</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    نسخه {APP_VERSION_INFO.currentVersion}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white/90 border border-white/20">
                    تم: {activeTheme.name}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                  {currentProfile.title || 'تنظیمات یکپارچه، مدیریت پروفایل، یادآورها، تم‌های رنگی و پایگاه داده'}
                </p>
              </div>
            </div>

            {/* Quick action buttons on banner */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="دانلود سریع فایل پشتیبان JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">پشتیبان سریع</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (deferredPrompt && onInstallClick) {
                    onInstallClick();
                  } else {
                    setIsMobileInstallModalOpen(true);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="نصب اپلیکیشن روی گوشی"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>نصب در گوشی</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all animate-fade-in">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* --- Settings Menu: Interactive Categorized Tab Navigation --- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 px-2 border-b border-gray-100 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>منوی دسته‌بندی تنظیمات</span>
          </div>
          <span className="text-[11px] text-gray-400">
            برای پیمایش سریع و راحت روی گوشی، بخش مورد نظر را لمس کنید
          </span>
        </div>

        {/* Scrollable Navigation Bar (Mobile-first ergonomics) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border border-gray-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.shortLabel}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200/80 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: USER PROFILE MANAGEMENT (مدیریت پروفایل کاربری) */}
      {/* ========================================================================= */}
      {(activeTab === 'PROFILE' || activeTab === 'ALL') && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span>بخش اول: مدیریت پروفایل کاربری</span>
            </h3>
            <span className="text-[11px] text-gray-400">شناسنامه و نماد شخصی باغبان</span>
          </div>

          {/* Quick Profile Stats Highlight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-emerald-800 block">نام نمایشی</span>
              <span className="text-sm font-bold text-emerald-950 mt-0.5 block truncate">
                {currentProfile.name || 'باغبان'}
              </span>
            </div>
            <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-teal-800 block">اهداف متصل</span>
              <span className="text-sm font-bold text-teal-950 mt-0.5 block">
                {toPersianDigits(goals.length)} هدف فعال
              </span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-blue-800 block">تسک‌ها و عادات</span>
              <span className="text-sm font-bold text-blue-950 mt-0.5 block">
                {toPersianDigits(tasks.length + habits.length)} مورد
              </span>
            </div>
            <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-purple-800 block">تم انتخابی</span>
              <span className="text-sm font-bold text-purple-950 mt-0.5 block truncate">
                {activeTheme.emoji} {activeTheme.name}
              </span>
            </div>
          </div>

          {/* Embedded UserProfileSettings component */}
          {onSaveUserProfile && (
            <UserProfileSettings
              userProfile={userProfile}
              onSaveProfile={onSaveUserProfile}
              onNotify={showNotification}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: REMINDER & GENTLE ALARMS (تنظیمات یادآور و هشدارهای صوتی) */}
      {/* ========================================================================= */}
      {(activeTab === 'REMINDERS' || activeTab === 'ALL') && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span>بخش دوم: تنظیمات یادآور، آلارم و آوای ملایم</span>
            </h3>
            <span className="text-[11px] text-gray-400">یادآوری‌های صوتی بدون اضطراب</span>
          </div>

          {onSaveReminderSettings && (
            <ReminderAlarmSettings
              reminderSettings={reminderSettings}
              onSaveSettings={onSaveReminderSettings}
              onNotify={showNotification}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: COLOR THEMES & APPEARANCE (تم‌های رنگی و ظاهر برنامه) */}
      {/* ========================================================================= */}
      {(activeTab === 'THEMES' || activeTab === 'ALL') && (
        <div className="bg-white rounded-2xl border border-purple-100/90 p-5 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <span>بخش سوم: تم‌های رنگی و شخصی‌سازی ظاهر برنامه</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                رنگ‌بندی کلی برنامه، حالت روز/شب و افکت‌های بصری باغبانی را مطابق سلیقه خود تنظیم کنید.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1.5">
                <span>{activeTheme.emoji}</span>
                <span>تم فعلی: {activeTheme.name}</span>
              </span>
            </div>
          </div>

          {/* Interactive Themes Palette Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {THEME_PALETTES.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleApplyTheme(theme.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                    isSelected
                      ? `border-emerald-600 bg-gradient-to-b from-white to-emerald-50/40 ring-2 ${theme.activeRing} shadow-sm`
                      : 'border-gray-200/80 bg-white hover:border-emerald-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Top Bar with Emoji and Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl select-none">{theme.emoji}</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <span>{theme.name}</span>
                        </h4>
                        <span className="text-[10px] text-gray-400 block line-clamp-1">
                          {theme.subtitle}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-lg shadow-2xs border border-white"
                      style={{ backgroundColor: theme.primaryHex }}
                      title={`رنگ اصلی: ${theme.primaryHex}`}
                    />
                    <div
                      className="w-6 h-6 rounded-lg shadow-2xs border border-white"
                      style={{ backgroundColor: theme.accentHex }}
                      title={`رنگ مکمل: ${theme.accentHex}`}
                    />
                    <div className="flex-1 text-[10px] text-gray-500 line-clamp-1 mr-1">
                      {theme.description}
                    </div>
                  </div>

                  {/* Active Indicator Button */}
                  <button
                    type="button"
                    className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>تم فعال است</span>
                      </>
                    ) : (
                      <span>انتخاب این تم</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Live Preview Card */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>پیش‌نمایش زنده تم انتخابی ({activeTheme.name})</span>
              </span>
              <span className="text-[10px] text-gray-400">نمونه عناصر برنامه</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs text-lg"
                  style={{ backgroundColor: activeTheme.primaryHex }}
                >
                  {activeTheme.emoji}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">باغچه اهداف و عادات سالانه</h5>
                  <p className="text-[11px] text-gray-500">پیشرفت ۷۵٪ در فصل جاری</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  style={{ backgroundColor: activeTheme.primaryHex }}
                  className="px-3 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  دکمه اصلی
                </button>
                <span
                  style={{ color: activeTheme.primaryHex, borderColor: `${activeTheme.primaryHex}40` }}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border bg-gray-50"
                >
                  برچسب نمونه
                </span>
              </div>
            </div>
          </div>

          {/* Display & Accessibility Options */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-gray-600" />
              <span>تنظیمات حالت نمایش و دسترسی‌پذیری</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dark Mode toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">حالت تیره (شب)</span>
                  <span className="text-[10px] text-gray-500">کاهش نور صفحه در شب</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDarkMode(!isDarkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isDarkMode ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center text-[10px] ${
                      isDarkMode ? 'left-1' : 'right-1'
                    }`}
                  >
                    {isDarkMode ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>

              {/* Plant Growth animations toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">انیمیشن رویش گیاهان</span>
                  <span className="text-[10px] text-gray-500">جلوه‌های بصری شکوفایی</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePlantAnimations(!enablePlantAnimations)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    enablePlantAnimations ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center text-[10px] ${
                      enablePlantAnimations ? 'left-1' : 'right-1'
                    }`}
                  >
                    🌱
                  </span>
                </button>
              </div>

              {/* Haptic feedback toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">ویبره و بازخورد لمسی</span>
                  <span className="text-[10px] text-gray-500">لرزش ملایم هنگام تیک زدن</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHaptic(!enableHapticFeedback)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    enableHapticFeedback ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center text-[10px] ${
                      enableHapticFeedback ? 'left-1' : 'right-1'
                    }`}
                  >
                    📳
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CATEGORIES & BOTANICAL PLANTS (دسته‌بندی‌ها و گیاهان اختصاصی) */}
      {/* ========================================================================= */}
      {(activeTab === 'CATEGORIES' || activeTab === 'ALL') && (
        <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>بخش چهارم: دسته‌بندی‌های اهداف و گیاهان اختصاصی</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                هر دسته‌بندی دارای رنگ و گیاه نمادین است که به زیرمجموعه‌ها، تسک‌ها و عادات ارث داده می‌شود.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddCategory}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>دسته‌بندی جدید</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('آیا مایل به بازنشانی دسته‌بندی‌ها به مقادیر پیش‌فرض هستید؟')) {
                    onResetCategories();
                    showNotification('دسته‌بندی‌ها به حالت اولیه بازنشانی شدند.');
                  }
                }}
                title="بازنشانی دسته‌های اولیه"
                className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {categories.map((cat) => {
              const linkedGoals = goals.filter(g => g.categoryId === cat.id);
              const linkedTasks = tasks.filter(t => t.categoryId === cat.id);
              const linkedHabits = habits.filter(h => h.categoryId === cat.id);
              const plantObj = ALL_PLANT_TYPES.find(p => p.id === cat.plantType) || ALL_PLANT_TYPES[0];

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border p-4 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
                  style={{ borderRightWidth: '4px', borderRightColor: cat.colorHex }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${cat.colorHex}15`,
                          borderColor: `${cat.colorHex}40`,
                          color: cat.colorHex,
                        }}
                      >
                        {renderIcon(cat.iconName, 'w-4 h-4')}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{cat.title}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: cat.colorHex }}
                            title={`کد رنگ: ${cat.colorHex}`}
                          />
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span>{toPersianDigits(linkedGoals.length)} هدف</span>
                          <span>•</span>
                          <span>{toPersianDigits(linkedTasks.length)} تسک</span>
                          <span>•</span>
                          <span>{toPersianDigits(linkedHabits.length)} عادت</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="ویرایش دسته‌بندی و گیاه"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryClick(cat.id, cat.title)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Plant details card */}
                  <div className="bg-emerald-50/50 rounded-lg p-2 flex items-center justify-between gap-2 border border-emerald-100/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlantIcon type={cat.plantType} size="sm" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-950 block truncate">
                          گیاه نمادین: {cat.plantType || 'بونسای'}
                        </span>
                        <span className="text-[10px] text-emerald-800/80 block truncate">
                          {plantObj.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DATA MANAGEMENT & STORAGE (بخش مدیریت داده‌ها و پشتیبان‌گیری) */}
      {/* ========================================================================= */}
      {(activeTab === 'DATA' || activeTab === 'ALL') && (
        <div className="bg-white rounded-2xl border border-blue-100/90 p-5 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span>بخش پنجم: مدیریت داده‌ها، پایگاه داده و پشتیبان‌گیری</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                تهیه نسخه پشتیبان شخصی به صورت فایل استاندارد JSON، کپی سریع، بازیابی داده‌ها و همگام‌سازی ذخیره‌سازی سه‌لایه.
              </p>
            </div>

            {/* Current Entities Summary Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-600" />
                <span>{toPersianDigits(goals.length)} هدف</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>{toPersianDigits(tasks.length)} تسک</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold flex items-center gap-1">
                <Sprout className="w-3 h-3 text-teal-600" />
                <span>{toPersianDigits(habits.length)} عادت</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/80 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-600" />
                <span>{toPersianDigits(categories.length)} دسته‌بندی</span>
              </span>
            </div>
          </div>

          {/* Persistence Architecture Status Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-teal-50/60 border border-blue-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-blue-700 text-white shrink-0 mt-0.5 shadow-2xs">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">سامانه ذخیره‌سازی سه‌لایه فعال است</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    همگام با سرور، IndexedDB و LocalStorage
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  تمامی تغییرات شما بلافاصله ذخیره می‌شوند. برای جلوگیری از پاک شدن در هنگام تعویض مرورگر یا گوشی، می‌توانید همیشه یک نسخه پشتیبان JSON دانلود کنید.
                </p>
              </div>
            </div>
          </div>

          {/* Export & Restore Control Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Card 1: Export Backup */}
            <div className="p-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 to-white flex flex-col justify-between gap-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <span>تهیه نسخه پشتیبان (Export)</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  خروجی کامل از ساختار درختی اهداف، تسک‌ها، برنامه‌های تکرار، عادات و سوابق تیک‌ها به عنوان یک فایل متنی JSON در پوشه دانلودهای شما.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل پشتیبان (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJsonToClipboard}
                  title="کپی مستقیم کد نسخه پشتیبان در حافظه موقت"
                  className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  {isCopyingJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>کپی کد JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpdateAndBackupModalOpen(true)}
                  className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="پشتیبان‌گیری و بارگذاری سریع فقط تسک‌ها و وضعیت انجام آن‌ها"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>پشتیبان ویژه تسک‌ها</span>
                </button>
              </div>
            </div>

            {/* Card 2: Restore Backup */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-2xs transition-all ${
                isDraggingFile 
                  ? 'border-teal-500 bg-teal-100/50 scale-[1.01]' 
                  : 'border-teal-200/90 bg-gradient-to-br from-teal-50/40 to-white'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-xs sm:text-sm">
                  <div className="p-1.5 rounded-lg bg-teal-700 text-white shadow-2xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span>بازگردانی اطلاعات (Restore / Import)</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  فایل پشتیبان قبلی خود را بارگذاری کنید. پیش از اعمال، پیش‌نمایش محتوا به شما نشان داده می‌شود و می‌توانید نحوه ادغام یا جایگزینی را تعیین نمایید.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <label className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" />
                  <span>انتخاب فایل پشتیبان (.json)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRawJsonInput('');
                    setIsTextPasteModalOpen(true);
                  }}
                  className="px-3 py-2 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>ورود متنی (Paste)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: MOBILE APP INSTALLATION & OFFLINE (نصب اپلیکیشن موبایل) */}
      {/* ========================================================================= */}
      {(activeTab === 'MOBILE' || activeTab === 'ALL') && (
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-green-50/50 rounded-3xl border-2 border-emerald-200/90 p-5 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-600 text-white flex items-center justify-center shadow-md shrink-0 border border-emerald-400/40">
                <Smartphone className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-emerald-950">
                    بخش ششم: نصب اپلیکیشن جوانه روی گوشی (۱۰۰٪ مطابق با پیش‌نمایش)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                    نسخه رسمی و کامل
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 mt-0.5 font-medium">
                  دارای تمامی بخش‌ها، صفحه تنظیمات، تقویم شمسی و آیکون رسمی جوانه با قابلیت کارکرد آفلاین
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (deferredPrompt && onInstallClick) {
                    onInstallClick();
                  } else {
                    setIsMobileInstallModalOpen(true);
                  }
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                title="نصب مستقیم جوانه روی صفحه گوشی موبایل"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>نصب فوری در گوشی</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileInstallModalOpen(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="اسکن بارکد QR یا مشاهده راهنمای نصب در کروم گوشی"
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>بارکد QR و راهنما</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUpdateAndBackupModalOpen(true)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="بررسی وضعیت نسخه‌ها و پشتیبان‌گیری"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>لاگ نسخه (v{APP_VERSION_INFO.currentVersion})</span>
              </button>
            </div>
          </div>

          {/* Feature comparison guarantee cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white/95 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>لوگوی رسمی و باکیفیت جوانه</span>
              </span>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                با نصب مستقیم، آیکون زیبای جوانه سبز با کیفیت بالا روی صفحه اصلی گوشی شما قرار می‌گیرد.
              </p>
            </div>

            <div className="p-3 bg-white/95 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دارای تمامی بخش‌ها و تنظیمات</span>
              </span>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                شامل صفحه تنظیمات کامل، تقویم شمسی رسمی ایران، باغبانی و مراحل رشد، تایمر و آلارم صوتی.
              </p>
            </div>

            <div className="p-3 bg-white/95 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>کارکرد کامل آفلاین</span>
              </span>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                تمامی داده‌ها روی حافظه امن گوشی شما ذخیره شده و پس از نصب، بدون نیاز به اینترنت کار می‌کند.
              </p>
            </div>
          </div>

          {/* Quick Instructions box */}
          <div className="bg-emerald-100/60 rounded-2xl p-3.5 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-950 font-bold text-[11px]">
                راهنمای سریع: در کروم گوشی، منوی <strong>(⋮)</strong> را بزنید و <strong>«نصب برنامه»</strong> یا <strong>«افزودن به صفحه اصلی»</strong> را انتخاب کنید.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileInstallModalOpen(true)}
              className="text-[11px] font-black text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
            >
              مشاهده راهنمای کامل تصویری ←
            </button>
          </div>

          {/* Collapsible raw APK prototype section */}
          <div className="border border-gray-200 bg-gray-50/70 rounded-2xl p-3.5 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowApkDetails(!showApkDetails)}
              className="w-full flex items-center justify-between text-right cursor-pointer"
            >
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>توضیحات و دانلود فایل خام نصبی APK (نسخه آزمایشی / Prototype)</span>
              </span>
              {showApkDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showApkDetails && (
              <div className="text-xs text-gray-700 space-y-3 pt-2 border-t border-gray-200 leading-relaxed">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-extrabold text-[11px] block">
                    نکته مهم درباره فایل javaneh.apk:
                  </span>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    فایل خام نصبی یک نسخه اولیه (پروتوتایپ) نیتیو بوده و امکانات پیشرفته پیش‌نمایش (مانند تب تنظیمات، تقویم و نمادهای گرافیکی کامل) در آن هنوز گنجانده نشده است. <strong>برای داشتن تجربه ۱۰۰٪ کامل و مشابه همین پیش‌نمایش، حتماً از روش «نصب مستقیم در گوشی (PWA)» در بالای همین بخش استفاده نمایید.</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="/javaneh.apk"
                    download="javaneh.apk"
                    className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                    title="دانلود مستقیم فایل نصبی اندروید (javaneh.apk)"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>دانلود فایل خام javaneh.apk (۲۲.۵۸ مگابایت)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsApkModalOpen(true)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>دانلود هوشمند با بررسی هش و سلامت فایل</span>
                  </button>
                </div>

                {/* Troubleshooting guide toggle */}
                <div className="border border-amber-200/80 bg-amber-50/60 rounded-xl p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    className="w-full flex items-center justify-between text-right cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>راهنمای رفع خطاهای احتمالی نصب فایل APK</span>
                    </span>
                    {showTroubleshooting ? (
                      <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                    )}
                  </button>

                  {showTroubleshooting && (
                    <div className="text-[10px] text-amber-950 space-y-2 pt-1 border-t border-amber-200/60 leading-relaxed">
                      <p>
                        <strong>۱. خطای Play Protect:</strong> روی «جزئیات بیشتر» و سپس «نصب به هر حال» بزنید.
                      </p>
                      <p>
                        <strong>۲. خطای برنامه نصب نشد:</strong> ابتدا نسخه‌های قبلی نصب‌شده از جوانه را از گوشی لغو نصب (Uninstall) کنید.
                      </p>
                      <p>
                        <strong>۳. خطای تجزیه بسته (Parsing Error):</strong> فایل‌های قبلی javaneh.apk را از پوشه Downloads حذف و مجدداً دانلود فرمایید.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Philosophy of Javaneh Card */}
      <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>درباره ساختار و فلسفه برنامه‌ریزی جوانه</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          جوانه یک سیستم برنامه‌ریزی متصل و سلسله‌مراتبی بر اساس تقویم جلالی است:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
            <span className="font-bold text-emerald-900 block mb-1">۱. درخت اهداف سالانه</span>
            <span className="text-emerald-800/80 text-[11px] leading-normal">
              چشم‌اندازهای کلان که با آغاز سال یا در میانه سال کاشته می‌شوند.
            </span>
          </div>
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3">
            <span className="font-bold text-teal-900 block mb-1">۲. شاخه‌های فصلی و ماهانه</span>
            <span className="text-teal-800/80 text-[11px] leading-normal">
              شکستن اهداف سالانه به فصل‌های باقیمانده و ماه‌های متناظر با ارث‌بری خودکار دسته و گیاه.
            </span>
          </div>
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
            <span className="font-bold text-amber-900 block mb-1">۳. برگ‌های تسک و عادت روزانه</span>
            <span className="text-amber-800/80 text-[11px] leading-normal">
              تسک‌ها و عادات هفتگی و روزانه که با هر تیک زدن، بذر را آبیاری کرده و به بار می‌نشانند.
            </span>
          </div>
        </div>
      </div>

      {/* Modal for Add / Edit Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-emerald-100 relative my-8 space-y-4">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${catColor}15`,
                  borderColor: `${catColor}40`,
                  color: catColor,
                }}
              >
                {renderIcon(catIconName, 'w-4 h-4')}
              </div>
              <h3 className="text-base font-bold text-emerald-950">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
              </h3>
            </div>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عنوان دسته‌بندی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  placeholder="مثال: رشد فردی، کسب‌وکار، مهارت‌های فنی..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-medium outline-hidden"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>انتخاب رنگ دسته‌بندی</span>
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCatColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        catColor === c.hex ? 'scale-110 border-gray-900 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {catColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 mr-2">
                    <span className="text-[10px] text-gray-400">کد هگز:</span>
                    <input
                      type="text"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-[11px] font-mono text-center outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Plant Picker for this category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>انتخاب گیاه نمادین این دسته‌بندی</span>
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50/50">
                  {ALL_PLANT_TYPES.map((plant) => {
                    const isSelected = catPlantType === plant.id;
                    return (
                      <button
                        key={plant.id}
                        type="button"
                        onClick={() => setCatPlantType(plant.id)}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                            : 'bg-white border-gray-200 hover:border-emerald-200'
                        }`}
                      >
                        <PlantIcon type={plant.id} size="sm" />
                        <span className="text-[10px] font-bold text-emerald-950 truncate w-full block">
                          {plant.id}
                        </span>
                        <span className="text-[9px] text-gray-400 truncate w-full block">
                          {plant.description.split('،')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  انتخاب آیکون نمایشی
                </label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50/50">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = catIconName === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCatIconName(item.name)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview of Category Badge */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">پیش‌نمایش برچسب:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-2xs"
                    style={{
                      backgroundColor: `${catColor}15`,
                      color: catColor,
                      borderColor: `${catColor}40`,
                    }}
                  >
                    {renderIcon(catIconName, 'w-3.5 h-3.5')}
                    <span>{catTitle || 'عنوان دسته‌بندی'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg">
                    <PlantIcon type={catPlantType} size="xs" />
                    <span>{catPlantType}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingCategory ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-rose-100 text-right space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">حذف دسته‌بندی</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              آیا از حذف دسته‌بندی <strong>«{categoryToDelete.title}»</strong> مطمئن هستید؟
            </p>
            {(categoryToDelete.linkedGoalsCount > 0 || categoryToDelete.linkedTasksCount > 0 || categoryToDelete.linkedHabitsCount > 0) && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                توجه: موارد متصل به این دسته ({categoryToDelete.linkedGoalsCount} هدف، {categoryToDelete.linkedTasksCount} تسک، {categoryToDelete.linkedHabitsCount} عادت) پس از حذف، به دسته‌بندی دیگر منتقل خواهند شد.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCategory(categoryToDelete.id);
                  showNotification(`دسته‌بندی «${categoryToDelete.title}» با موفقیت حذف شد`);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                حذف قطعی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Preview & Confirmation Dialog */}
      {restoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-emerald-100 text-right overflow-hidden animate-scale-up my-6">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-950">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">پیش‌نمایش و تایید بازگردانی اطلاعات</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">بررسی محتویات فایل پشتیبان پیش از اعمال در برنامه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-800">نام فایل / مبدا:</span>
                  <span className="font-mono text-emerald-900 dir-ltr">{restoreModal.fileName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span>حجم تقریبی فایل:</span>
                  <span className="font-semibold text-gray-800">{toPersianDigits(restoreModal.fileSizeKb)} کیلوبایت</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span>تاریخ ثبت خروجی:</span>
                  <span className="font-semibold text-gray-800">{restoreModal.exportDate}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-900 block mb-2">رکوردهای شناسایی‌شده در این نسخه:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 block">اهداف</span>
                    <span className="text-base font-black text-emerald-950 mt-0.5 block">{toPersianDigits(restoreModal.counts.goals)}</span>
                    <span className="text-[9px] text-gray-500">فعلی: {toPersianDigits(goals.length)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-800 block">تسک‌ها</span>
                    <span className="text-base font-black text-blue-950 mt-0.5 block">{toPersianDigits(restoreModal.counts.tasks)}</span>
                    <span className="text-[9px] text-gray-500">فعلی: {toPersianDigits(tasks.length)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 text-center">
                    <span className="text-[10px] text-teal-800 block">عادات</span>
                    <span className="text-base font-black text-teal-950 mt-0.5 block">{toPersianDigits(restoreModal.counts.habits)}</span>
                    <span className="text-[9px] text-gray-500">فعلی: {toPersianDigits(habits.length)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-center">
                    <span className="text-[10px] text-purple-800 block">دسته‌ها</span>
                    <span className="text-base font-black text-purple-950 mt-0.5 block">{toPersianDigits(restoreModal.counts.categories)}</span>
                    <span className="text-[9px] text-gray-500">فعلی: {toPersianDigits(categories.length)}</span>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-gray-900 block">انتخاب شیوه بازگردانی:</span>
                
                <div 
                  onClick={() => setRestoreModal({ ...restoreModal, mode: 'MERGE' })}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    restoreModal.mode === 'MERGE' 
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500' 
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                    restoreModal.mode === 'MERGE' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                  }`}>
                    {restoreModal.mode === 'MERGE' && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">ترکیب و ادغام هوشمند (Merge)</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">پیشنهادی</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      داده‌های جدید بدون حذف اطلاعات فعلی اضافه شده و رکوردهای یکسان به‌روزرسانی می‌شوند. کارهای فعلی پاک نخواهند شد.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setRestoreModal({ ...restoreModal, mode: 'REPLACE' })}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    restoreModal.mode === 'REPLACE' 
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500' 
                      : 'border-gray-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                    restoreModal.mode === 'REPLACE' ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300'
                  }`}>
                    {restoreModal.mode === 'REPLACE' && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">جایگزینی کامل (Clean Replace)</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">حذف داده‌های فعلی</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      تمام داده‌های فعلی حذف شده و دقیقاً محتویات این فایل پشتیبان به عنوان اطلاعات اصلی در برنامه قرار می‌گیرد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety Option: Auto Backup Before Restore */}
              <label className="flex items-center gap-2.5 pt-1 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreModal.autoBackupBeforeRestore}
                  onChange={(e) => setRestoreModal({ ...restoreModal, autoBackupBeforeRestore: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                  پیش از اعمال بازگردانی، یک نسخه پشتیبان اضطراری از وضعیت فعلی برنامه به صورت خودکار دانلود شود (توصیه می‌شود).
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRestoreModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تایید و اجرای بازگردانی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual JSON Text Paste Dialog */}
      {isTextPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-teal-100 text-right overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/70 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-teal-950">
                <div className="p-2 rounded-xl bg-teal-700 text-white shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">ورود متنی اطلاعات نسخه پشتیبان (JSON)</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">الصاق مستقیم متن کپی شده از فایل پشتیبان جوانه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTextPasteModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTextPasteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  کد یا متن JSON پشتیبان:
                </label>
                <textarea
                  value={rawJsonInput}
                  onChange={(e) => setRawJsonInput(e.target.value)}
                  placeholder={`{\n  "appName": "جوانه (Javaneh)",\n  "version": "1.3.0",\n  "categories": [...],\n  "goals": [...],\n  "tasks": [...],\n  "habits": [...]\n}`}
                  rows={8}
                  dir="ltr"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs text-gray-800 bg-gray-50/50"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  می‌توانید کدی که قبلاً با دکمه «کپی کد JSON» ذخیره کرده بودید را در این کادر پیست کنید.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTextPasteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بررسی و پیش‌نمایش</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APK Integrity & Resumable Download Modal */}
      <ApkIntegrityModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Safe Pre-Update Backup, Tasks Backup & Google Play Release Notes Modal */}
      <UpdateAndBackupModal
        isOpen={isUpdateAndBackupModalOpen}
        onClose={() => setIsUpdateAndBackupModalOpen(false)}
        tasks={tasks}
        goals={goals}
        habits={habits}
        categories={categories}
        userProfile={userProfile}
        reminderSettings={reminderSettings}
        onImportTasksOnly={onImportTasksOnly}
        onOpenFullApkDownload={() => setIsApkModalOpen(true)}
      />

      {/* Mobile Install (PWA & QR Code) Modal */}
      <MobileInstallModal
        isOpen={isMobileInstallModalOpen}
        onClose={() => setIsMobileInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallClick={onInstallClick || (() => {})}
      />
    </div>
  );
};
