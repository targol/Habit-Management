export interface ReleaseNote {
  version: string;
  versionCode: number;
  releaseDate: string; // Persian date
  gregorianDate: string;
  title: string;
  highlights: string[];
  changes: {
    type: 'FEATURE' | 'IMPROVEMENT' | 'SECURITY' | 'FIX';
    title: string;
    description: string;
  }[];
}

export const APP_VERSION_INFO = {
  currentVersion: '1.2.0',
  currentVersionCode: 120,
  releaseDate: '۱۴۰۵/۰۷/۰۱',
  apkFileName: 'javaneh-v1.2.0.apk',
  apkPackageName: 'ir.javaneh.app',
  targetSdk: 'Android 14 (API 34)',
  minSdk: 'Android 7.0 (API 24)',
  storageMode: 'ISOLATED_CLIENT_FIRST', // هر کاربر در حافظه محلی و مجزای دستگاه خود ذخیره‌سازی دارد
};

export const RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: '1.2.0',
    versionCode: 120,
    releaseDate: '۱۴۰۵/۰۷/۰۱',
    gregorianDate: '2026-09-23',
    title: 'نسخه رسمی گوگل‌پلی و سامانه محافظت از داده‌ها',
    highlights: [
      'تفکیک ۱۰۰٪ داده‌های هر کاربر روی گوشی و ایزولاسیون کامل حریم خصوصی',
      'سیستم پشتیبان‌گیری خودکار و هوشمند پیش از آپگرید (Pre-Update Safe Backup)',
      'مدیریت دسترسی حافظه با بررسی مجوزها و پیام هشدار در صورت عدم اجازه',
      'سیستم نسخه‌بندی رسمی APK و گزارش تغییرات تفصیلی (Changelog)',
      'انیمیشن‌های نرم شکوفایی باغچه و فیلتر فصلی در گزارش‌ها'
    ],
    changes: [
      {
        type: 'SECURITY',
        title: 'جداسازی داده‌ها و ایزوله‌سازی برای انتشار گوگل‌پلی',
        description: 'داده‌های تسک‌ها، اهداف و عادات مستقیماً در پایگاه داده امن داخلی گوشی هر کاربر (Sandboxed SQLite / IndexedDB) ذخیره شده و هیچ تداخلی با سایر کاربران ندارد. با آپدیت اپلیکیشن، دیتابیس بدون تغییر حفظ شده و تنها کدها به‌روز می‌شوند.'
      },
      {
        type: 'FEATURE',
        title: 'تهیه پشتیبان خودکار پیش از به‌روزرسانی (Pre-Update Auto-Backup)',
        description: 'هنگام اقدام به دریافت نسخه جدید، اپلیکیشن به صورت خودکار از وضعیت فعلی تسک‌ها و اهداف فایل بکاپ تهیه کرده و در حافظه امن ذخیره می‌کند.'
      },
      {
        type: 'SECURITY',
        title: 'مدیریت مجوز ذخیره‌سازی با هشدار شفاف',
        description: 'اگر کاربر دسترسی به ذخیره فایل روی دستگاه را ندهد، یک هشدار مشخص نمایش داده می‌شود و کاربر می‌تواند ریسک عدم بکاپ‌گیری فیزیکی را تایید نموده و سپس آپدیت را ادامه دهد.'
      },
      {
        type: 'FEATURE',
        title: 'پشتیبان‌گیری و بازگردانی سریع تسک‌ها (Tasks Fast Backup & Restore)',
        description: 'امکان ذخیره فایل اختصاصی تسک‌ها به همراه وضعیت تیک‌ها و یادآورها و بارگذاری مجدد سریع با یک کلیک.'
      },
      {
        type: 'IMPROVEMENT',
        title: 'صفحه لاگ تغییرات و نسخه‌بندی (Version Release Notes)',
        description: 'نمایش شماره نسخه دقیق APK، کد ساخت، تاریخ انتشار شمسی و تغییرات اعمال‌شده در هر نسخه.'
      }
    ]
  },
  {
    version: '1.1.0',
    versionCode: 110,
    releaseDate: '۱۴۰۵/۰۶/۱۵',
    gregorianDate: '2026-09-06',
    title: 'بهبود باغچه رشد، انیمیشن گیاهان و فیلترهای فصلی',
    highlights: [
      'افزودن انیمیشن نرم رشد و شکوفایی گل‌ها در صفحه باغچه',
      'فیلتر فصول در تحلیل درصد دستیابی به اهداف',
      'نمایش فقط گل‌های تکمیل‌شده در باکس شکوفایی'
    ],
    changes: [
      {
        type: 'FEATURE',
        title: 'انیمیشن آرام گل‌ها',
        description: 'تغییر سایز و شکوفایی تدریجی متناسب با درصد پیشرفت روزانه.'
      },
      {
        type: 'IMPROVEMENT',
        title: 'فیلتر فصلی گزارش‌ها',
        description: 'امکان بررسی اهداف به تفکیک بهار، تابستان، پاییز و زمستان.'
      }
    ]
  },
  {
    version: '1.0.0',
    versionCode: 100,
    releaseDate: '۱۴۰۵/۰۵/۰۱',
    gregorianDate: '2026-07-22',
    title: 'نسخه پایه جوانه',
    highlights: [
      'مدیریت تسک‌ها با تقویم شمسی و تکرارهای دوره‌ای',
      'تعریف اهداف سالانه و فصلی و ماهانه',
      'ردیابی عادات با باغبانی مجازی',
      'تایمر تمرکز پومودورو با آلارم‌های ملایم'
    ],
    changes: [
      {
        type: 'FEATURE',
        title: 'راه‌اندازی سامانه مدیریت اهداف جوانه',
        description: 'ثبت اطلاعات، یادآورها، دسته‌بندی با گیاهان اختصاصی و ذخیره‌سازی محلی چندلایه.'
      }
    ]
  }
];
