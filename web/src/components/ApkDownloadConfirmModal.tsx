import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck, 
  RefreshCw,
  Smartphone,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { toPersianDigits } from '../calendar/jalali';
import { APP_VERSION_INFO } from '../version';
import { downloadApkBlobSecure, checkApkAvailability, DownloadProgress } from '../services/apkDownloadService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const ApkDownloadConfirmModal: React.FC<Props> = ({ 
  isOpen, 
  onClose,
  deferredPrompt,
  onInstallClick 
}) => {
  const [apkInfo, setApkInfo] = useState<{ available: boolean; size?: number; formattedSize?: string; error?: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setDownloadProgress(null);
      setDownloadSuccess(false);
      setErrorMessage(null);
      return;
    }

    checkApkAvailability().then(info => {
      setApkInfo(info);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallPwa = () => {
    if (onInstallClick) {
      onInstallClick();
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      setShowPwaGuide(true);
    }
  };

  const handleConfirmDownload = async () => {
    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    const result = await downloadApkBlobSecure((prog) => {
      setDownloadProgress(prog);
    });

    setIsDownloading(false);

    if (result.success) {
      setDownloadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setErrorMessage(result.error || 'فایل نصبی در دسترس نیست.');
      if (result.isPwaRecommended) {
        setShowPwaGuide(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-lg overflow-hidden text-right animate-scale-up max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Smartphone className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>نصب و اجرای برنامه در اندروید</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-white/20">
                  نسخه {APP_VERSION_INFO.currentVersion}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                نصب سریع روی صفحه اصلی (PWA) و دریافت فایل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-gray-700 leading-relaxed overflow-y-auto flex-1">
          {/* Recommended Option: 1-Click PWA Installation */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-950 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>روش پیشنهادی: نصب مستقیم روی گوشی (PWA)</span>
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                ۱۰۰٪ بدون خطا
              </span>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed">
              برنامه «جوانه» به صورت <strong>وب‌اپلیکیشن پیش‌رونده (PWA)</strong> مهندسی شده است. با افزودن آن به صفحه اصلی، بدون نیاز به دانلود فایل‌های حجیم و بدون مشکل خطای تجزیه (Parse Error)، آیکون جوانه روی گوشی شما قرار می‌گیرد و به شکل <strong>تمام‌صفحه و کاملاً آفلاین</strong> کار می‌کند.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>کارکرد آفلاین بدون اینترنت</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>حفظ کامل داده‌ها در گوشی</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmDownload}
              disabled={isDownloading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال دریافت فایل نصبی کامل ({downloadProgress ? `${toPersianDigits(downloadProgress.percent)}%` : '...'})</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دانلود و دریافت فایل نصبی کامل APK ({apkInfo?.formattedSize || 'آماده دانلود'})</span>
                </>
              )}
            </button>

            {/* Critical Android Installation Notice for smooth install */}
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-[11px] text-amber-950 space-y-1.5 leading-relaxed text-right">
              <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>نکته مهم برای نصب موفق بدون خطا روی گوشی:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[10.5px] text-amber-900/90 pr-1">
                <li>
                  اگر قبلاً نسخه تستی از برنامه روی گوشی شما نصب شده، <strong>ابتدا آن را حذف (Uninstall) نمایید</strong> تا تداخل امضای دیجیتال برطرف شود.
                </li>
                <li>
                  در صورت هشدار امنیتی مرورگر گوشی، گزینه <strong>«اجازه نصب از این منبع» (Allow from this source)</strong> را تأیید کنید.
                </li>
              </ul>
            </div>

            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>نصب سریع به صورت میانبر در صفحه اصلی (PWA)</span>
              </button>
            )}
          </div>

          {/* Android PWA Step-by-Step Instructions */}
          {(!deferredPrompt || showPwaGuide) && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-xs">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>راهنمای ۳ ثانیه‌ای نصب در مرورگر گوشی (کروم یا سامسونگ):</span>
              </div>
              <ol className="text-[11px] text-gray-700 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                <li>
                  در مرورگر کروم گوشی، دکمه <strong>سه‌نقطه (⋮)</strong> در گوشه بالا یا پایین را لمس کنید.
                </li>
                <li>
                  گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> را انتخاب کنید.
                </li>
                <li>
                  دکمه <strong>Install / افزودن</strong> را تایید کنید. آیکون جوانه بلافاصله مانند برنامه‌های عادی اندروید در منوی برنامه‌های شما افزوده خواهد شد.
                </li>
              </ol>
            </div>
          )}

          {/* Section: Direct APK Package Spec & Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-gray-600" />
                <span>مشخصات بسته نصبی مستقل (APK):</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                {APP_VERSION_INFO.apkPackageName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-gray-500 text-[10px] block">حجم واقعی پکیج:</span>
                <span className="font-bold text-gray-900 text-xs block font-mono">
                  {apkInfo?.formattedSize || '۹۰۸ کیلوبایت'}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-gray-500 text-[10px] block">نسخه اندروید:</span>
                <span className="font-bold text-emerald-800 text-xs block font-mono">
                  v{APP_VERSION_INFO.currentVersion} (کد ۱۵۰)
                </span>
              </div>
            </div>
          </div>

            {/* Download Progress Indicator */}
            {isDownloading && downloadProgress && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-emerald-900">
                  <span>در حال دریافت فایل نصبی...</span>
                  <span className="font-mono">{toPersianDigits(downloadProgress.percent)}%</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">توجه:</span>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {downloadSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold">فایل نصبی با موفقیت ذخیره شد!</span>
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>پشتیبانی کامل از حافظه داخلی و حالت آفلاین</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};

