export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const WEEKDAYS = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

export const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '';
  const str = n.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

// Gregorian to Jalali conversion algorithm
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

export function jalaliToFormattedString(j: JalaliDate): string {
  const m = j.month.toString().padStart(2, '0');
  const d = j.day.toString().padStart(2, '0');
  return `${j.year}/${m}/${d}`;
}

export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function getDayOfWeek(j: JalaliDate): number {
  // Approximate reference: 1403/01/01 was Wednesday (index 4 in Sat=0..Fri=6)
  // Let's compute based on current Date() if today:
  const now = new Date();
  const d = now.getDay(); // Sunday=0, Monday=1.. Saturday=6
  return (d + 1) % 7; // Saturday=0..Friday=6
}

// Iranian official holidays fixed in Solar Calendar
export const IRANIAN_SOLAR_HOLIDAYS: Record<string, string> = {
  '01/01': 'عید نوروز',
  '01/02': 'عید نوروز',
  '01/03': 'عید نوروز',
  '01/04': 'عید نوروز',
  '01/12': 'روز جمهوری اسلامی',
  '01/13': 'روز طبیعت (سیزده‌بدر)',
  '03/14': 'رحلت امام خمینی',
  '03/15': 'قیام ۱۵ خرداد',
  '11/22': 'پیروزی انقلاب اسلامی',
  '12/29': 'روز ملی شدن صنعت نفت'
};

export function isDateHoliday(j: JalaliDate): { isHoliday: boolean; title?: string } {
  const m = j.month.toString().padStart(2, '0');
  const d = j.day.toString().padStart(2, '0');
  const key = `${m}/${d}`;
  if (IRANIAN_SOLAR_HOLIDAYS[key]) {
    return { isHoliday: true, title: IRANIAN_SOLAR_HOLIDAYS[key] };
  }
  return { isHoliday: false };
}

// Jalali to Gregorian conversion
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd +
    ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= gd_m[gm]) {
    days -= gd_m[gm];
    gm++;
  }
  return new Date(gy, gm - 1, days + 1);
}

// Add days to Jalali Date
export function addDaysJalali(j: JalaliDate, days: number): JalaliDate {
  const g = jalaliToGregorian(j.year, j.month, j.day);
  g.setDate(g.getDate() + days);
  return gregorianToJalali(g.getFullYear(), g.getMonth() + 1, g.getDate());
}

export function parseJalaliString(str: string): JalaliDate | null {
  const parts = str.split('/').map(p => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return null;
}

export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Esfand leap year check (simplified)
  return 29;
}

export const WEEKS_OF_MONTH = [
  'هفته اول',
  'هفته دوم',
  'هفته سوم',
  'هفته چهارم',
  'هفته پنجم',
];

export function getWeekOfMonth(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

export function getCurrentPersianDateTimeString(): string {
  const now = new Date();
  const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const dateStr = jalaliToFormattedString(j);
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${dateStr} - ${toPersianDigits(`${hours}:${minutes}`)}`;
}


