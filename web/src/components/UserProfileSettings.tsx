import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_USER_PROFILE } from '../services/storageService';
import { processAndCompressImage } from '../utils/imageUtils';
import { toPersianDigits } from '../calendar/jalali';
import { 
  User, 
  Camera, 
  Check, 
  Trash2, 
  Sparkles, 
  UploadCloud,
  FileText,
  Smile,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface Props {
  userProfile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onNotify?: (msg: string) => void;
}

const BOTANICAL_AVATAR_PRESETS = [
  { id: 'sprout', emoji: '🌱', label: 'جوانه امید' },
  { id: 'flower', emoji: '🌸', label: 'شکوفه بهار' },
  { id: 'rose', emoji: '🌹', label: 'گل سرخ' },
  { id: 'cactus', emoji: '🌵', label: 'کاکتوس مقاوم' },
  { id: 'tree', emoji: '🌳', label: 'درخت تنومند' },
  { id: 'lotus', emoji: '🪷', label: 'نیلوفر آبی' },
  { id: 'sunflower', emoji: '🌻', label: 'آفتابگردان' },
  { id: 'olive', emoji: '🌿', label: 'شاخه زیتون' },
];

export const UserProfileSettings: React.FC<Props> = ({
  userProfile,
  onSaveProfile,
  onNotify,
}) => {
  const currentProfile = userProfile || DEFAULT_USER_PROFILE;

  const [name, setName] = useState(currentProfile.name || '');
  const [title, setTitle] = useState(currentProfile.title || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '🌱');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageSizeInfo, setImageSizeInfo] = useState<{ originalKb: number; compressedKb: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert uploaded image to lightweight compact DataURL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const result = await processAndCompressImage(file, 256, 0.8);
      setAvatarUrl(result.dataUrl);
      setImageSizeInfo({
        originalKb: result.originalSizeKb,
        compressedKb: result.compressedSizeKb,
      });
      onNotify?.(
        `تصویر با موفقیت فشرده و بهینه‌سازی شد (${toPersianDigits(result.originalSizeKb)} KB ➔ ${toPersianDigits(result.compressedSizeKb)} KB)`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطا در بارگذاری و فشرده‌سازی تصویر';
      onNotify?.(errorMsg);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      name: name.trim() || 'دوست من',
      title: title.trim(),
      avatarUrl: avatarUrl || '🌱',
      bio: bio.trim(),
    };
    onSaveProfile(updated);
    setSavedSuccess(true);
    onNotify?.('پروفایل کاربری با موفقیت به‌روزرسانی و ذخیره شد.');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isImageAvatar = avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('http'));

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/90 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>پروفایل و هویت کاربری من</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            نام، تصویر یا آواتار و یادداشت شخصی خود را برای نمایش در صفحه باغچه و بخش‌های برنامه تنظیم کنید.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>تغییرات ذخیره شد</span>
          </span>
        )}
      </div>

      {/* Main Avatar & Details Grid */}
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative group">
              <div 
                className="w-20 h-20 rounded-full border-2 border-emerald-400 bg-white shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105"
              >
                {isImageAvatar ? (
                  <img 
                    src={avatarUrl} 
                    alt="آواتار کاربر" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-4xl select-none" role="img" aria-label="آواتار">
                    {avatarUrl || '🌱'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                title="بارگذاری تصویر از دستگاه"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isProcessingImage}
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3 h-3" />
                <span>{isProcessingImage ? 'در حال بهینه‌سازی...' : 'بارگذاری عکس'}</span>
              </button>

              {isImageAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('🌱');
                    setImageSizeInfo(null);
                  }}
                  className="text-[11px] text-gray-500 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                  title="حذف تصویر و انتخاب آواتار پیش‌فرض"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Image upload limits hint */}
            <div className="text-[10px] text-gray-500 text-center max-w-[170px] leading-tight mt-0.5">
              <span className="text-emerald-700 font-medium">سقف حجم فایل: ۵ مگابایت</span>
              <span className="block text-gray-400 mt-0.5">فشرده‌سازی خودکار به کمتر از ۴۰KB</span>
              {imageSizeInfo && (
                <span className="block text-emerald-600 font-bold mt-0.5">
                  حجم ذخیره: {toPersianDigits(imageSizeInfo.compressedKb)} KB
                </span>
              )}
            </div>
          </div>

          {/* Botanical Preset Selector */}
          <div className="flex-1 w-full space-y-2">
            <span className="block text-[11px] font-semibold text-gray-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>یا انتخاب از آواتارهای گیاهی جوانه:</span>
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {BOTANICAL_AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarUrl === preset.emoji;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.emoji);
                      setImageSizeInfo(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-300/60 scale-105 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                    title={preset.label}
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    <span className="text-[9px] text-gray-600 mt-1 truncate max-w-full">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>نام یا نیک‌نیم (نام دلخواه) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: تارگل، کیان، مریم یا هر نام دلخواه..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all bg-white text-xs font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              اسم رسمی نیاز نیست؛ این نام یا نیک‌نیم در نوار بالای اپلیکیشن و خوش‌آمدگویی روزانه نمایش داده می‌شود.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-emerald-600" />
              <span>عنوان یا برچسب رشد</span>
            </label>
            <input
              type="text"
              placeholder="مثلاً: باغبان متعهد اهداف، پژوهشگر"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>شعار یا یادداشت تمرکز روزانه</span>
          </label>
          <textarea
            rows={2}
            placeholder="جمله‌ای انگیزشی یا یادآوری شخصی..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all bg-white text-xs"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره مشخصات پروفایل</span>
          </button>
        </div>
      </form>
    </div>
  );
};
