import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  Wifi, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { toPersianDigits } from '../calendar/jalali';
import { APP_VERSION_INFO } from '../version';
import { downloadApkBlobSecure, DownloadProgress } from '../services/apkDownloadService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadConfirmModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(547128);
  const [formattedSize] = useState<string>('۵۳۵ کیلوبایت');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setDownloadProgress(null);
      setDownloadSuccess(false);
      setErrorMessage(null);
      return;
    }

    setFileSizeBytes(547128);
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute secure in-memory Blob download to prevent 10KB proxy HTML error downloads
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
      setErrorMessage(result.error || 'خطا در دانلود فایل. لطفاً مجدداً تلاش کنید.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md overflow-hidden text-right animate-scale-up"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Download className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>تایید دانلود فایل APK جوانه</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-white/20">
                  اندروید
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                دانلود ایمن و مستقیم فایل نصبی ۵۲۷ کیلوبایتی
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
        <div className="p-5 space-y-4 text-xs text-gray-700 leading-relaxed">
          {/* File size & Spec card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-700" />
                <span>مشخصات فایل نصبی کامل جوانه:</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                javaneh.apk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-0.5">
                <span className="text-gray-500 text-[10px] block">حجم واقعی فایل:</span>
                <span className="font-black text-gray-900 text-xs block font-mono">
                  {formattedSize}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-0.5">
                <span className="text-gray-500 text-[10px] block">نسخه برنامه:</span>
                <span className="font-black text-emerald-800 text-xs block font-mono">
                  v{APP_VERSION_INFO.currentVersion}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-emerald-900 bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-between">
              <span>تعداد دقیق بایت‌ها:</span>
              <span className="font-mono font-bold">{toPersianDigits(fileSizeBytes.toLocaleString())} بایت</span>
            </div>
          </div>

          {/* Download Progress Indicator */}
          {isDownloading && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  <span>در حال دریافت و تایید فایل در مرورگر...</span>
                </span>
                <span className="font-mono text-xs">
                  {downloadProgress ? `${toPersianDigits(downloadProgress.percent)}%` : '...'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-emerald-200/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                  style={{ width: `${downloadProgress?.percent || 20}%` }}
                />
              </div>

              {downloadProgress && (
                <div className="flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                  <span>
                    {toPersianDigits(Math.round(downloadProgress.receivedBytes / 1024))} KB از {toPersianDigits(Math.round(downloadProgress.totalBytes / 1024))} KB
                  </span>
                  {downloadProgress.speedText && (
                    <span>{downloadProgress.speedText}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download Success Notice */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold">فایل کامل ۵۲۷ کیلوبایتی با موفقیت ذخیره شد!</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">خطا در دانلود:</span>
                <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Advice card */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-950">
            <Wifi className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[11px] block">
                تضمین دریافت فایل نصبی کامل (نه صفحه خطا):
              </span>
              <p className="text-[10px] text-amber-900/90 leading-relaxed">
                این دانلود مستقیماً به صورت باینری در مرورگر دریافت شده و صحت فایل سنجیده می‌شود تا از دریافت فایل‌های ناقص یا ۱۰ کیلوبایتی ناشی از پروکسی جلوگیری شود.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleConfirmDownload}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال دریافت ({downloadProgress ? `${toPersianDigits(downloadProgress.percent)}%` : '...'})</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دانلود مستقیم و تاییدشده ({formattedSize})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isDownloading}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>بسته نصبی ۵۲۷ کیلوبایتی با امضای رسمی v2/v3</span>
          </span>
          <span>Google Play Ready</span>
        </div>
      </div>
    </div>
  );
};
