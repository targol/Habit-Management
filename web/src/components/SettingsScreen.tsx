import React, { useState, useRef, useEffect } from 'react';
import { Category, Goal, AppTask, Habit, AppBackupData, UserProfile, ReminderSettings, AlarmSoundItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';
import { toPersianDigits, getTodayJalali, getCurrentPersianDateTimeString } from '../calendar/jalali';
import { PRESET_ALARM_SOUNDS, previewSound, stopAllAlarmSounds, playAlarmSound } from '../services/soundService';
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission, sendBrowserNotification } from '../services/reminderService';
import { DEFAULT_USER_PROFILE, DEFAULT_REMINDER_SETTINGS } from '../services/storageService';
import { UserProfileSettings } from './UserProfileSettings';
import { ReminderAlarmSettings } from './ReminderAlarmSettings';
import { ApkIntegrityModal } from './ApkIntegrityModal';
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
  Globe
} from 'lucide-react';

interface Props {
  categories: Category[];
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  userProfile?: UserProfile;
  reminderSettings?: ReminderSettings;
  onSaveUserProfile?: (profile: UserProfile) => void;
  onSaveReminderSettings?: (settings: ReminderSettings) => void;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategories: () => void;
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
  onSaveUserProfile,
  onSaveReminderSettings,
  onSaveCategory,
  onDeleteCategory,
  onResetCategories,
  onImportAllData,
}) => {
  // Modal / Form state for Category add/edit
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [catTitle, setCatTitle] = useState('');
  const [catColor, setCatColor] = useState('#10B981');
  const [catPlantType, setCatPlantType] = useState('بونسای');
  const [catIconName, setCatIconName] = useState('Briefcase');

  // Status message for actions
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Troubleshooting guide toggle for Android APK
  const [showTroubleshooting, setShowTroubleshooting] = useState(true);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // In-app category deletion confirmation modal state
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    title: string;
    linkedGoalsCount: number;
    linkedTasksCount: number;
    linkedHabitsCount: number;
  } | null>(null);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
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

  // 1. Export JSON with durable Blob download and Jalali formatted filename
  const handleExportData = () => {
    try {
      const todayJ = getTodayJalali();
      const datePart = `${todayJ.year}-${String(todayJ.month).padStart(2, '0')}-${String(todayJ.day).padStart(2, '0')}`;
      const backup: AppBackupData = {
        appName: 'جوانه (Javaneh)',
        version: '1.0.0',
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
        version: '1.0.0',
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
      // Reset input value so same file can be re-selected if needed
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sticky Top Banner */}
      <div className="sticky -top-5 z-20 pt-5 pb-2.5 bg-[#F8F9F5]/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Settings className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>تنظیمات برنامه جوانه</span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                پروفایل کاربری، آلارم و یادآورهای صوتی، دسته‌بندی‌های اهداف و پشتیبان‌گیری
              </p>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section 1: User Profile & Identity */}
      {onSaveUserProfile && (
        <UserProfileSettings
          userProfile={userProfile}
          onSaveProfile={onSaveUserProfile}
          onNotify={showNotification}
        />
      )}

      {/* Section 2: Reminder & Gentle Alarm Settings */}
      {onSaveReminderSettings && (
        <ReminderAlarmSettings
          reminderSettings={reminderSettings}
          onSaveSettings={onSaveReminderSettings}
          onNotify={showNotification}
        />
      )}

      {/* Section 3: Categories & Plants Management */}
      <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>دسته‌بندی‌های اهداف و گیاهان اختصاصی</span>
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

      {/* Section: Mobile App & Android APK Download */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-white to-green-50/40 rounded-2xl border border-emerald-200/90 p-5 shadow-xs space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <span>دانلود اپلیکیشن اندروید (فایل نصبی APK)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  نسخه آفلاین موبایل
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                نصب مستقیم اپلیکیشن «جوانه» روی گوشی یا تبلت اندرویدی با فایل ۲۲ مگابایتی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsApkModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="بررسی هش، سلامت فایل و دانلود هوشمند با قابلیت Resume"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>بررسی هش و دانلود هوشمند (با قابلیت Resume)</span>
            </button>

            <a
              href="/javaneh.apk"
              download="javaneh.apk"
              className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              title="دانلود مستقیم فایل نصبی اندروید (javaneh.apk)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>دانلود مستقیم فایل (۲۲.۵۸ مگابایت)</span>
            </a>
          </div>
        </div>

        {/* Installation guide 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">۱</span>
              <span>دانلود فایل</span>
            </span>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              دکمه سبز بالا را لمس کنید تا فایل <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-800 font-mono">javaneh.apk</code> به طور کامل روی گوشی ذخیره شود.
            </p>
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">۲</span>
              <span>رفع هشدار Play Protect</span>
            </span>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              روی فایل کلیک کنید. اگر پیام امنیتی داد، روی <strong>«جزئیات بیشتر (More details)»</strong> و سپس <strong>«نصب به هر حال (Install anyway)»</strong> بزنید.
            </p>
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">۳</span>
              <span>نصب و اجرای برنامه</span>
            </span>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              دکمه Install / نصب را بزنید تا آیکون «جوانه» روی صفحه برنامه‌ها قرار گیرد.
            </p>
          </div>
        </div>

        {/* Troubleshooting toggle box */}
        <div className="border border-amber-200/80 bg-amber-50/60 rounded-xl p-3.5 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full flex items-center justify-between text-right cursor-pointer"
          >
            <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>فایل APK نصب نشد یا خطا داد؟ (راهنمای رفع مشکل)</span>
            </span>
            {showTroubleshooting ? (
              <ChevronUp className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            )}
          </button>

          {showTroubleshooting && (
            <div className="text-xs text-amber-950 space-y-2 pt-1 border-t border-amber-200/60 leading-relaxed">
              <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                <span className="font-extrabold text-amber-900 block">
                  ۱. حذف کامل نسخه قبلی برنامه (در صورت وجود نسخه قدیمی):
                </span>
                <p className="text-[11px] text-gray-600">
                  اگر قبلاً نسخه‌ای از جوانه را روی گوشی خود نصب داشته‌اید، اندروید به دلیل تفاوت در امضای دیجیتال بسته اجازه به‌روزرسانی روی نسخه قبلی را نمی‌دهد و خطای «برنامه نصب نشد» می‌دهد. <strong>ابتدا برنامه قبلی را از گوشی لغو نصب (Uninstall) کنید</strong> و سپس فایل نصبی جدید را اجرا نمایید.
                </p>
              </div>

              <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                <span className="font-extrabold text-amber-900 block">
                  ۲. پیام «برنامه مسدود شد» یا Google Play Protect (بسیار رایج):
                </span>
                <p className="text-[11px] text-gray-600">
                  چون این برنامه مستقیماً دانلود شده و در گوگل‌پلی منتشر نشده، سپر امنیتی گوگل آن را اخطار می‌دهد. کافیست در همان پنجره روی فلش یا متن <strong>«جزئیات بیشتر (More details)»</strong> ضربه بزنید و سپس گزینه <strong>«نصب به هر حال (Install anyway)»</strong> را انتخاب کنید.
                </p>
              </div>

              <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                <span className="font-extrabold text-amber-900 block">
                  ۳. خطای «خطا در تجزیه بسته (There was a problem parsing the package)»:
                </span>
                <p className="text-[11px] text-gray-600">
                  این خطا معمولاً به علت <strong>دانلود ناقص یا فایل کش‌شده قبلی</strong> رخ می‌دهد. فایل‌های قبلی <code className="text-emerald-800 font-mono font-bold">javaneh.apk</code> را از پوشه Downloads (بارگیری‌ها) گوشی به طور کامل حذف کرده و مجدداً دانلود را انجام دهید.
                </p>
              </div>

              <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                <span className="font-extrabold text-amber-900 block">
                  ۴. خطای «نصب برنامه‌های ناشناخته (Install unknown apps)»:
                </span>
                <p className="text-[11px] text-gray-600">
                  در صورت نمایش این پیام، روی گزینه <strong>تنظیمات (Settings)</strong> کلیک کرده و کلید <strong>«اجازه دادن از این منبع (Allow from this source)»</strong> را برای مرورگر یا مدیریت فایل فعال نمایید.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section: Recommended guaranteed PWA alternative */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl text-white shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-200" />
            <h4 className="text-xs font-black text-white">
              روش جایگزین و تضمینی ۱۰۰٪ بدون نیاز به فایل APK: نصب نسخه وب‌اپلیکیشن (PWA)
            </h4>
          </div>
          <p className="text-[11px] text-emerald-50 leading-relaxed">
            برنامه «جوانه» یک وب‌اپلیکیشن پیشرو (PWA) کامل است. بدون نیاز به دانلود ۲۲ مگابایت فایل و بدون هیچ اخطار امنیتی، می‌توانید آن را مانند یک برنامه بومی روی صفحه گوشی خود نصب کنید:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg border border-white/15">
              <span className="font-bold block text-emerald-200 mb-0.5">گام اول:</span>
              <span>همین صفحه را در مرورگر <strong>Google Chrome</strong> یا <strong>Samsung Internet</strong> گوشی خود باز کنید.</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg border border-white/15">
              <span className="font-bold block text-emerald-200 mb-0.5">گام دوم:</span>
              <span>روی <strong>سه نقطه (⋮)</strong> در بالای مرورگر ضربه بزنید.</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg border border-white/15">
              <span className="font-bold block text-emerald-200 mb-0.5">گام سوم:</span>
              <span>گزینه <strong>«افزودن به صفحه اصلی (Add to Home screen)»</strong> یا <strong>«نصب برنامه (Install App)»</strong> را لمس کنید.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Data Backup & Persistent Storage (Export & Restore) */}
      <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>پشتیبان‌گیری و بازگردانی اطلاعات (Export & Restore)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              تهیه نسخه پشتیبان شخصی به صورت فایل استاندارد JSON روی حافظه دستگاه شما و امکان بازگردانی کامل یا ادغام هر زمان که نیاز باشد.
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
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5 shadow-2xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">سامانه ذخیره‌سازی سه‌لایه فعال است</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  همگام با دیسک و IndexedDB
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/85 mt-1 leading-relaxed">
                داده‌های شما بلافاصله در دیتابیس سرور، پایگاه داده مرورگر (IndexedDB) و حافظه محلی ذخیره می‌شوند. برای اطمینان مضاعف و امکان انتقال داده‌ها به دستگاه یا مرورگر دیگر، می‌توانید یک نسخه پشتیبان آفلاین با دکمه زیر دانلود کنید.
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
                ? 'border-emerald-500 bg-emerald-100/50 scale-[1.01]' 
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

      {/* Section 3: Extensible Settings Info & Calendar Philosophy */}
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
            {/* Header */}
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
              {/* File details card */}
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

              {/* Counts breakdown */}
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

              {/* Action Buttons */}
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
                  placeholder={`{\n  "appName": "جوانه (Javaneh)",\n  "version": "1.0.0",\n  "categories": [...],\n  "goals": [...],\n  "tasks": [...],\n  "habits": [...]\n}`}
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
    </div>
  );
};
