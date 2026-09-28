import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Settings, 
  Calendar, 
  ShieldCheck, 
  Download,
  AlertCircle,
  HelpCircle,
  QrCode,
  Share2,
  CheckCheck,
  ShieldAlert,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallClick: () => void;
  onOpenSettings?: () => void;
}

export const MobileInstallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallClick,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'why_apk_error' | 'apk'>('pwa');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Detect mobile user agent
  const isMobile = typeof window !== 'undefined' && (
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);

  // Use current origin or location
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://javaneh-app.com';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Smartphone className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>راهنمای نصب جوانه در گوشی</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-white/20">
                  حل ارور نصب
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                نصب ۱۰۰٪ تضمینی بدون ارور، با منوی کامل تنظیمات و کارکرد آفلاین
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

        {/* Tab navigation */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>نصب بدون ارور (PWA رسمی)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('why_apk_error')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'why_apk_error'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>علت ارور نصب در گوشی؟</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'apk'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>فایل خام APK</span>
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-5 space-y-4 text-gray-700 text-xs leading-relaxed">
          {activeTab === 'pwa' && (
            <>
              {/* Quick shortcut to Settings */}
              {onOpenSettings && (
                <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-xs">دنبال دکمه تنظیمات هستید؟</h4>
                      <p className="text-[11px] text-emerald-800">
                        منوی تنظیمات هم در نوار پایین و هم در بالای صفحه به راحتی در دسترس شماست.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>باز کردن تنظیمات</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}

              {/* One-touch install if supported */}
              {deferredPrompt ? (
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>مرورگر گوشی شما آماده نصب فوری جوانه است</span>
                    </h4>
                    <p className="text-[11px] text-emerald-100 mt-1">
                      با زدن دکمه زیر، جوانه بدون هیچ اروری مستقیماً در صفحه برنامه‌های گوشی شما نصب می‌شود.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onInstallClick}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0 text-center"
                  >
                    نصب جوانه در گوشی
                  </button>
                </div>
              ) : null}

              {/* Mobile direct instructions */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>آموزش نصب ۲ ثانیه‌ای در گوشی (۱۰۰٪ تضمینی و بدون خطا):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Android Chrome */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${isAndroid ? 'bg-white border-emerald-400 shadow-xs ring-2 ring-emerald-500/20' : 'bg-white/80 border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">۱</span>
                        <span>گوشی‌های اندروید (Chrome)</span>
                      </div>
                      {isAndroid && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">دستگاه شما</span>}
                    </div>
                    <ol className="text-[11px] text-gray-700 space-y-2 list-decimal pr-4 leading-relaxed">
                      <li>در بالای مرورگر کروم، منوی <strong>سه نقطه (⋮)</strong> را لمس کنید.</li>
                      <li>روی گزینه <strong>«نصب برنامه (Install app)»</strong> یا <strong>«افزودن به صفحه اصلی (Add to Home screen)»</strong> بزنید.</li>
                      <li>دکمه <strong>Install / افزودن</strong> را تایید نمایید. جوانه با آیکون سبز در لیست برنامه‌ها قرار می‌گیرد!</li>
                    </ol>
                  </div>

                  {/* iOS Safari */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${isIOS ? 'bg-white border-emerald-400 shadow-xs ring-2 ring-emerald-500/20' : 'bg-white/80 border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">۲</span>
                        <span>گوشی‌های آیفون (Safari)</span>
                      </div>
                      {isIOS && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">دستگاه شما</span>}
                    </div>
                    <ol className="text-[11px] text-gray-700 space-y-2 list-decimal pr-4 leading-relaxed">
                      <li>در پایین صفحه سافاری، دکمه <strong>اشتراک‌گذاری (Share ⎋)</strong> را بزنید.</li>
                      <li>به پایین اسکرول کرده و <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.</li>
                      <li>در بالا راست دکمه <strong>Add</strong> را لمس کنید.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* QR Code section (primarily for desktop users to scan, or link copy on phone) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>آدرس اپلیکیشن برای ارسال به دیگران یا باز کردن مجدد</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{copiedLink ? 'کپی شد!' : 'کپی لینک'}</span>
                  </button>
                </div>

                {!isMobile && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-gray-100">
                    <div className="p-2 bg-white rounded-2xl border-2 border-emerald-100 shadow-xs shrink-0 flex items-center justify-center">
                      <QRCodeSVG
                        value={currentUrl}
                        size={110}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#1B5E20"
                        imageSettings={{
                          src: '/icon.svg',
                          x: undefined,
                          y: undefined,
                          height: 24,
                          width: 24,
                          excavate: true,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed text-center sm:text-right">
                      اگر با کامپیوتر هستید، دوربین گوشی خود را مقابل بارکد بالا بگیرید تا وب‌اپ جوانه باز شود. سپس طبق راهنمای بالا دکمه «افزودن به صفحه اصلی» را بزنید.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'why_apk_error' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>دلیل ارور دادن گوشی هنگام نصب فایل APK چیست؟</span>
                </div>
                <div className="text-[11px] space-y-2 text-amber-900 leading-relaxed">
                  <p>
                    اگر در گوشی خود فایل <strong>javaneh.apk</strong> را دانلود کرده و هنگام نصب با ارورهایی مانند:
                  </p>
                  <ul className="list-disc pr-5 font-semibold text-rose-800 space-y-1">
                    <li>«خطا در تجزیه بسته» (There was a problem parsing the package)</li>
                    <li>«برنامه نصب نشد» (App not installed)</li>
                    <li>یا اخطار مسدود شدن توسط Google Play Protect</li>
                  </ul>
                  <p>
                    مواجه شدید، علت این است که در نسخه‌های جدید اندروید (اندروید ۱۲ تا ۱۵)، سیستم عامل فایل‌های APK آزمایشی بدون امضای معتبر فروشگاه (گوگل پلی / بازار) را مسدود می‌کند و همچنین فایل‌های APK باینری با معماری‌های خاص ممکن است با پردازنده گوشی شما سازگار نباشند.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>راهکار نهایی و ۱۰۰٪ تضمینی (بدون نیاز به فایل APK):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  وب‌اپلیکیشن پیش‌رونده (PWA) جوانه به گونه‌ای طراحی شده که <strong>دقیقاً معادل یک برنامه کامل اندرویدی و آیفونی</strong> کار می‌کند؛ با این مزایا:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>بدون هیچ‌گونه ارور نصب یا هشدار امنیتی</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>آیکون رسمی جوانه با نماد سبز در گوشی</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>شامل تمام بخش‌های تنظیمات، تقویم و تایمر</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>کارکرد آفلاین و حجم بسیار سبک (زیر ۳ مگابایت)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pwa')}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>مشاهده نحوه افزودن سریع به صفحه گوشی</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>توجه درباره فایل خام اندروید (APK):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  اگر قصد تست توسعه‌دهندگی دارید، می‌توانید فایل خام APK را دانلود کنید. توجه فرمایید که برای نصب موفق APK باید گزینه «نصب از منابع ناشناخته (Install from unknown sources)» در تنظیمات گوشی شما فعال باشد. در غیر این صورت، روش PWA در تب اول بدون هیچ خطایی اجرا می‌شود.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3 text-center sm:text-right">
                <h4 className="font-bold text-gray-800 text-xs">دانلود مستقیم فایل خام APK (۲۲.۵ مگابایت):</h4>
                <a
                  href="/javaneh.apk"
                  download="javaneh.apk"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل خام javaneh.apk (۲۲.۵ مگابایت)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-gray-400">
            جوانه نسخه ۱.۰.۱ • طراحی ویژه برای گوشی‌های هوشمند
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
