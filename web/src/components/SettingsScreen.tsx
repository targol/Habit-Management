import React, { useState } from 'react';
import { Category, Goal, AppTask, Habit } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { PlantIcon, ALL_PLANT_TYPES } from './PlantIcon';
import { toPersianDigits } from '../calendar/jalali';
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
  Target
} from 'lucide-react';

interface Props {
  categories: Category[];
  goals: Goal[];
  tasks: AppTask[];
  habits: Habit[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategories: () => void;
  onImportAllData?: (data: { categories: Category[]; goals: Goal[]; tasks: AppTask[]; habits: Habit[] }) => void;
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
      alert('حداقل یک دسته‌بندی باید در برنامه وجود داشته باشد.');
      return;
    }
    const linkedGoalsCount = goals.filter(g => g.categoryId === catId).length;
    const linkedTasksCount = tasks.filter(t => t.categoryId === catId).length;
    const linkedHabitsCount = habits.filter(h => h.categoryId === catId).length;

    let confirmMsg = `آیا از حذف دسته‌بندی «${title}» مطمئن هستید؟`;
    if (linkedGoalsCount > 0 || linkedTasksCount > 0 || linkedHabitsCount > 0) {
      confirmMsg += `\nتوجه: ${linkedGoalsCount} هدف، ${linkedTasksCount} تسک و ${linkedHabitsCount} عادت به این دسته مرتبط هستند. پس از حذف، به دسته اول منتقل می‌شوند.`;
    }

    if (window.confirm(confirmMsg)) {
      onDeleteCategory(catId);
      showNotification(`دسته‌بندی «${title}» حذف شد.`);
    }
  };

  // Export JSON
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      categories,
      goals,
      tasks,
      habits,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `javaneh_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('نسخه پشتیبان داده‌ها با موفقیت دانلود شد.');
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.categories && parsed.goals && onImportAllData) {
            onImportAllData(parsed);
            showNotification('داده‌ها با موفقیت بازیابی شدند.');
          } else {
            alert('فرمت فایل پشتیبان معتبر نیست.');
          }
        } catch (err) {
          alert('خطا در خواندن فایل پشتیبان.');
        }
      };
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
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Settings className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>تنظیمات برنامه جوانه</span>
            </h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              مدیریت دسته‌بندی‌های اهداف، گیاهان نمادین، پالت رنگ‌ها و ساختار برنامه‌ریزی
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section 1: Categories & Plants Management */}
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

      {/* Section 2: Data Backup & Restore */}
      <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>پشتیبان‌گیری و انتقال داده‌ها</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            می‌توانید تمام اهداف، تسک‌ها، عادات و تنظیمات دسته‌بندی را ذخیره یا در دستگاه دیگر بازیابی کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>دانلود نسخه پشتیبان کامل (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>بازیابی از فایل پشتیبان</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
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
    </div>
  );
};
