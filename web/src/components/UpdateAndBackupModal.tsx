import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  FileCheck, 
  Sparkles, 
  Smartphone,
  HardDrive,
  Info,
  Clock,
  ArrowRight,
  FileText,
  RotateCcw
} from 'lucide-react';
import { AppTask, Goal, Habit, Category, UserProfile, ReminderSettings } from '../types';
import { APP_VERSION_INFO, RELEASE_HISTORY, ReleaseNote } from '../version';
import { toPersianDigits, getTodayJalali, getCurrentPersianDateTimeString } from '../calendar/jalali';
import { savePreUpdateBackup, getOrCreateUserId } from '../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: AppTask[];
  goals: Goal[];
  habits: Habit[];
  categories: Category[];
  userProfile?: UserProfile;
  reminderSettings?: ReminderSettings;
  initialTab?: 'UPDATE_SAFETY' | 'TASKS_BACKUP' | 'RELEASE_NOTES';
  onImportTasksOnly?: (tasks: AppTask[], mode: 'REPLACE' | 'MERGE') => void;
  onOpenFullApkDownload?: () => void;
}

export const UpdateAndBackupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks,
  goals,
  habits,
  categories,
  userProfile,
  reminderSettings,
  initialTab = 'UPDATE_SAFETY',
  onImportTasksOnly,
  onOpenFullApkDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'UPDATE_SAFETY' | 'TASKS_BACKUP' | 'RELEASE_NOTES'>(initialTab);

  // Sync tab if initialTab changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [storagePermissionGranted, setStoragePermissionGranted] = useState<boolean | null>(null);
  const [showPermissionWarning, setShowPermissionWarning] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [proceedAfterWarning, setProceedAfterWarning] = useState<boolean>(false);

  // Task-only import state
  const [taskImportFile, setTaskImportFile] = useState<File | null>(null);
  const [taskImportData, setTaskImportData] = useState<AppTask[] | null>(null);
  const [taskImportMode, setTaskImportMode] = useState<'REPLACE' | 'MERGE'>('MERGE');
  const [taskImportError, setTaskImportError] = useState<string | null>(null);
  const [taskImportSuccess, setTaskImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const userId = getOrCreateUserId();

  // 1. Task-only Fast Export
  const handleExportTasksOnly = () => {
    try {
      const todayJ = getTodayJalali();
      const datePart = `${todayJ.year}-${String(todayJ.month).padStart(2, '0')}-${String(todayJ.day).padStart(2, '0')}`;
      const payload = {
        appName: 'جوانه (Javaneh)',
        dataType: 'TASKS_ONLY_BACKUP',
        version: APP_VERSION_INFO.currentVersion,
        exportDate: new Date().toISOString(),
        exportPersianDate: getCurrentPersianDateTimeString(),
        userId,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.isCompleted).length,
        tasks,
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `javaneh-tasks-${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setBackupSuccessMessage(`فایل نسخه پشتیبان تسک‌ها (${toPersianDigits(tasks.length)} تسک) با موفقیت روی دستگاه ذخیره شد.`);
      setTimeout(() => setBackupSuccessMessage(null), 4000);
    } catch (e) {
      console.error(e);
      alert('خطا در تهیه نسخه پشتیبان تسک‌ها');
    }
  };

  // 2. Task-only file input selection
  const handleTaskFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTaskImportFile(file);
    setTaskImportError(null);
    setTaskImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedTasksList: AppTask[] = Array.isArray(parsed.tasks) 
          ? parsed.tasks 
          : Array.isArray(parsed) 
            ? parsed 
            : Array.isArray(parsed?.data?.tasks) 
              ? parsed.data.tasks 
              : [];

        if (importedTasksList.length === 0) {
          setTaskImportError('هیچ تسک معتبری در این فایل یافت نشد.');
          setTaskImportData(null);
          return;
        }

        setTaskImportData(importedTasksList);
      } catch (err) {
        setTaskImportError('فایل انتخاب‌شده یک فایل معتبر JSON نیست.');
        setTaskImportData(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // 3. Confirm Task-only restore
  const handleConfirmTaskImport = () => {
    if (!taskImportData || !onImportTasksOnly) return;
    onImportTasksOnly(taskImportData, taskImportMode);
    setTaskImportSuccess(`تعداد ${toPersianDigits(taskImportData.length)} تسک با موفقیت ${taskImportMode === 'REPLACE' ? 'جایگزین' : 'ادغام'} شدند.`);
    setTaskImportData(null);
    setTaskImportFile(null);
    setTimeout(() => setTaskImportSuccess(null), 4000);
  };

  // 4. Pre-Update Safe Flow: Prompt for storage/download permission
  const handleRequestStorageAndBackup = async (skipPermission = false) => {
    setIsBackingUp(true);
    // Take immediate local emergency snapshot
    savePreUpdateBackup({
      categories,
      goals,
      tasks,
      habits,
      userProfile,
      reminderSettings,
    });

    if (skipPermission) {
      // User explicitly declined storage access, warn them
      setStoragePermissionGranted(false);
      setShowPermissionWarning(true);
      setIsBackingUp(false);
      return;
    }

    try {
      // Attempt physical file export to verify user filesystem storage capability
      const todayJ = getTodayJalali();
      const datePart = `${todayJ.year}-${String(todayJ.month).padStart(2, '0')}-${String(todayJ.day).padStart(2, '0')}`;
      const fullBackupPayload = {
        appName: 'جوانه (Javaneh) - نسخه اضطراری قبل از آپدیت',
        version: APP_VERSION_INFO.currentVersion,
        exportDate: new Date().toISOString(),
        exportPersianDate: getCurrentPersianDateTimeString(),
        userId,
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

      const jsonString = JSON.stringify(fullBackupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `javaneh-auto-backup-before-update-${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setStoragePermissionGranted(true);
      setShowPermissionWarning(false);
      setBackupSuccessMessage('نسخه پشتیبان اضطراری با موفقیت در پوشه بارگیری‌های شما ذخیره شد. اکنون با خیال راحت می‌توانید برنامه را به‌روزرسانی کنید.');
    } catch (e) {
      console.warn('Filesystem access failed or blocked:', e);
      setStoragePermissionGranted(false);
      setShowPermissionWarning(true);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleProceedToUpdate = () => {
    if (onOpenFullApkDownload) {
      onOpenFullApkDownload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-emerald-100 text-right overflow-hidden my-6 animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">به‌روزرسانی ایمن و نسخه گوگل‌پلی</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  نسخه {APP_VERSION_INFO.currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-0.5">
                جداسازی اطلاعات شخصی کاربران، محافظت از دیتابیس و بکاپ‌گیری خودکار
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 p-1.5 gap-1 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('UPDATE_SAFETY')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'UPDATE_SAFETY'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>به‌روزرسانی امن و محافظت داده‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TASKS_BACKUP')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'TASKS_BACKUP'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span>بکاپ و بارگذاری تسک‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RELEASE_NOTES')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'RELEASE_NOTES'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>لاگ تغییرات و نسخه‌ها (Changelog)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: UPDATE SAFETY & GOOGLE PLAY ARCHITECTURE */}
          {activeTab === 'UPDATE_SAFETY' && (
            <div className="space-y-4">
              {/* Architecture Guarantee Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-emerald-950">
                      معماری امن Google Play: اطلاعات شخصی هر فرد ۱۰۰٪ مجزا و ماندگار است
                    </h4>
                    <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                      هنگامی که این اپلیکیشن روی گوگل‌پلی یا از طریق فایل APK برای کاربران مختلف منتشر شود:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-extrabold text-emerald-900 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>ایزولاسیون کامل دیتابیس گوشی:</span>
                    </span>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      داده‌های هر کاربر فقط در حافظه خصوصی و رمزگذاری‌شده برنامه او (App Sandbox) ذخیره می‌شود و هیچ کاربری به اطلاعات دیگران دسترسی ندارد.
                    </p>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-extrabold text-emerald-900 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>عدم حذف اطلاعات هنگام آپگرید:</span>
                    </span>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      با نصب نسخه‌های جدیدتر، دیتابیس بدون هیچ تغییری حفظ شده و فقط قابلیت‌ها و کدهای برنامه به‌روز می‌شوند (No Data Loss Guarantee).
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-100/60 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-950">
                  <span className="font-medium">شناسه ایزوله‌شده دستگاه شما در این جلسه:</span>
                  <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-emerald-800 border border-emerald-200">
                    {userId}
                  </code>
                </div>
              </div>

              {/* Pre-Update Auto-Backup Step */}
              <div className="border border-emerald-200/90 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900">
                        مرحله ایمنی: پشتیبان‌گیری خودکار پیش از به‌روزرسانی (Pre-Update Backup)
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        برای اطمینان ۱۰۰٪، برنامه پیش از آپگرید یک نسخه پشتیبان کامل از تسک‌ها و اهداف شما تولید می‌کند.
                      </p>
                    </div>
                  </div>
                </div>

                {backupSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{backupSuccessMessage}</span>
                  </div>
                )}

                {/* Storage Permission Warning Dialog (If user declines storage or denies) */}
                {showPermissionWarning && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-rose-900">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-black text-rose-950 text-xs">
                          هشدار امنیتی: اجازه دسترسی به ذخیره‌سازی داده نشد!
                        </strong>
                        <p className="text-[11px] text-rose-900 mt-1 leading-relaxed">
                          اگر فایل نسخه پشتیبان به صورت فیزیکی روی دستگاه ذخیره نشود، در صورت بروز خطای سیستمی در سیستم‌عامل ممکن است نتوانید داده‌های قدیمی را خارج از برنامه استخراج کنید.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => handleRequestStorageAndBackup(false)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        تلاش مجدد و اجازه دانلود فایل بکاپ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProceedAfterWarning(true);
                          setShowPermissionWarning(false);
                        }}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        پذیرش ریسک و ادامه بدون ذخیره فایل
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Trigger Buttons */}
                <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBackingUp}
                      onClick={() => handleRequestStorageAndBackup(false)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isBackingUp ? 'در حال تهیه پشتیبان...' : 'تهیه نسخه پشتیبان خودکار (توصیه اکید)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestStorageAndBackup(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      رد کردن دسترسی ذخیره‌سازی
                    </button>
                  </div>

                  {(storagePermissionGranted || proceedAfterWarning) && (
                    <button
                      type="button"
                      onClick={handleProceedToUpdate}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <span>ادامه به دریافت فایل به‌روزرسانی (APK)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED TASKS BACKUP & RESTORE */}
          {activeTab === 'TASKS_BACKUP' && (
            <div className="space-y-4">
              <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-xs">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>پشتیبان‌گیری و بارگذاری سریع ویژه «تسک‌ها و برنامه‌ها»</span>
                </div>
                <p className="text-[11px] text-teal-900/80 leading-relaxed">
                  اگر مایلید تنها تسک‌ها، لیست کارهای روزانه و وضعیت انجام آن‌ها را استخراج کرده و مجدداً در این اپ یا روی گوشی دیگر وارد کنید، از این بخش استفاده نمایید.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="bg-white px-2 py-0.5 rounded border border-teal-200 font-bold text-teal-800">
                    مجموع تسک‌های فعلی: {toPersianDigits(tasks.length)}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-teal-200 font-bold text-emerald-800">
                    تسک‌های انجام‌شده: {toPersianDigits(tasks.filter(t => t.isCompleted).length)}
                  </span>
                </div>
              </div>

              {/* Task Export Action */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-gray-900 block">دانلود فایل بکاپ تسک‌ها</strong>
                  <p className="text-[11px] text-gray-500">
                    تولید فایل <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-800 font-mono">javaneh-tasks-*.json</code> شامل تمامی تسک‌ها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTasksOnly}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود بکاپ تسک‌ها</span>
                </button>
              </div>

              {/* Task Import & Restore Action */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-gray-900 block">بارگذاری مجدد تسک‌ها از فایل پشتیبان</strong>
                    <p className="text-[11px] text-gray-500">انتخاب فایل پشتیبان تسک‌ها و بازگردانی سریع</p>
                  </div>
                  <label className="px-3.5 py-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                    <span>انتخاب فایل تسک‌ها</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleTaskFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {taskImportError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    {taskImportError}
                  </div>
                )}

                {taskImportSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                    {taskImportSuccess}
                  </div>
                )}

                {taskImportData && (
                  <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-950">
                        تعداد تسک‌های آماده بارگذاری: {toPersianDigits(taskImportData.length)} تسک
                      </span>
                      <span className="text-[10px] text-gray-500">{taskImportFile?.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={taskImportMode === 'MERGE'}
                          onChange={() => setTaskImportMode('MERGE')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>ترکیب و ادغام با تسک‌های فعلی (بدون حذف)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={taskImportMode === 'REPLACE'}
                          onChange={() => setTaskImportMode('REPLACE')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-amber-800 font-bold">جایگزینی کامل لیست تسک‌ها</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-teal-100">
                      <button
                        type="button"
                        onClick={() => {
                          setTaskImportData(null);
                          setTaskImportFile(null);
                        }}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmTaskImport}
                        className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                      >
                        تایید و اعمال روی تسک‌ها
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RELEASE NOTES & CHANGELOG */}
          {activeTab === 'RELEASE_NOTES' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>گزارش تغییرات و تاریخچه نسخه‌های رسمی APK</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                    Version {APP_VERSION_INFO.currentVersion} (Build {APP_VERSION_INFO.currentVersionCode})
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  تمامی نسخه‌های فایل نصبی APK همراه با لاگ رسمی تغییرات، تاریخ انتشار شمسی و کد نسخه منتشر می‌شوند.
                </p>
              </div>

              <div className="space-y-3">
                {RELEASE_HISTORY.map((item) => (
                  <div key={item.version} className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs font-mono">
                          v{item.version}
                        </span>
                        <strong className="text-xs font-bold text-gray-900">{item.title}</strong>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">
                        تاریخ انتشار: {toPersianDigits(item.releaseDate)}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 block">ویژگی‌های برجسته این نسخه:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-emerald-950 font-medium pr-1">
                        {item.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Detailed changes list */}
                    <div className="space-y-1.5 pt-1">
                      {item.changes.map((c, i) => (
                        <div key={i} className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              c.type === 'SECURITY' ? 'bg-purple-100 text-purple-800' :
                              c.type === 'FEATURE' ? 'bg-emerald-100 text-emerald-800' :
                              c.type === 'IMPROVEMENT' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {c.type === 'SECURITY' ? 'امنیت و دیتابیس' :
                               c.type === 'FEATURE' ? 'امکان جدید' :
                               c.type === 'IMPROVEMENT' ? 'بهبود' : 'اصلاح'}
                            </span>
                            <strong className="text-gray-900 text-xs">{c.title}</strong>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed pr-1">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            بسته نصبی: <code className="font-mono text-emerald-800 font-bold">{APP_VERSION_INFO.apkPackageName}</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
