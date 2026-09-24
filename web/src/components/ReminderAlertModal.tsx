import React, { useState } from 'react';
import { AppTask, Category, ReminderSettings } from '../types';
import { toPersianDigits } from '../calendar/jalali';
import { Bell, Check, Clock, Volume2, X, RotateCcw, ChevronDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  task: AppTask | null;
  category?: Category;
  soundTitle?: string;
  reminderSettings?: ReminderSettings;
  holidayNotice?: string | null;
  onDismiss: () => void;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

export const ReminderAlertModal: React.FC<Props> = ({
  isOpen,
  task,
  category,
  soundTitle = 'آرامش صبحگاهی',
  reminderSettings,
  holidayNotice,
  onDismiss,
  onComplete,
  onSnooze,
}) => {
  const [isChoosingInterval, setIsChoosingInterval] = useState(false);

  if (!isOpen || !task) return null;

  const defaultInterval = reminderSettings?.snoozeIntervalMinutes || 10;
  const availableIntervals = reminderSettings?.availableSnoozeIntervals && reminderSettings.availableSnoozeIntervals.length > 0
    ? reminderSettings.availableSnoozeIntervals
    : [5, 10, 15, 30, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-emerald-300 text-right overflow-hidden animate-scale-up">
        {/* Glowing Animated Top Header */}
        <div className={`p-6 relative text-white ${
          holidayNotice 
            ? 'bg-gradient-to-l from-rose-600 via-amber-600 to-emerald-700' 
            : 'bg-gradient-to-l from-emerald-600 to-teal-700'
        }`}>
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner animate-bounce">
              <Bell className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {holidayNotice ? '🗓️ اطلاع‌رسانی تسک در روز تعطیل' : 'یادآور تسک مهم'}
              </span>
              <h3 className="text-lg font-black tracking-tight text-white">
                {holidayNotice ? 'پیش‌اعلام تسک در روز تعطیل رسمی' : 'زمان انجام تسک فرا رسید!'}
              </h3>
            </div>
          </div>
        </div>

        {/* Task Details Content */}
        <div className="p-6 space-y-4 text-xs">
          {holidayNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900">
              <span className="text-base shrink-0">🎈</span>
              <div className="space-y-0.5 leading-relaxed">
                <strong className="text-xs font-black block">توجه: امروز تعطیل رسمی است!</strong>
                <p className="text-[11px] text-rose-800">
                  مناسبت امروز: <span className="font-bold underline decoration-rose-300">{holidayNotice}</span>. 
                  این تسک برای امروز برنامه‌ریزی شده و سیستم پیش از شروع به شما یادآوری کرده است.
                </p>
              </div>
            </div>
          )}

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/90 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-black text-emerald-950 leading-snug">
                {task.title}
              </span>
              {category && (
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${category.colorHex}20`, color: category.colorHex }}
                >
                  {category.title}
                </span>
              )}
            </div>

            {task.notes && (
              <p className="text-xs text-gray-600 leading-relaxed pt-1 border-t border-emerald-100/60">
                {task.notes}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
              {task.time && (
                <span className="flex items-center gap-1 font-semibold text-emerald-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>زمان موعد: {toPersianDigits(task.time)}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-teal-700">
                <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                <span>نغمه زنگ: {soundTitle}</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            این یادآوری هم‌زمان از طریق اعلان محلی مرورگر (Local Notifications) و پخش ملودی بدون کلام اعلام شده است.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onComplete(task.id);
                onDismiss();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              <Check className="w-4 h-4" />
              <span>انجام شد (ثبت تکمیل تسک)</span>
            </button>

            {/* Smart Snooze Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(task.id, defaultInterval);
                    onDismiss();
                  }}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>{toPersianDigits(defaultInterval)} دقیقه بعد یادآوری کن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChoosingInterval(!isChoosingInterval)}
                  className="py-2.5 px-3 bg-amber-50/60 hover:bg-amber-100/70 text-amber-800 border border-amber-200/60 font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <span>سایر فواصل هوشمند</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChoosingInterval ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Extended smart intervals popup row */}
              {isChoosingInterval && (
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 animate-fade-in flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-[10px] text-amber-900 w-full text-center font-bold pb-1">
                    انتخاب فاصله یادآوری مجدد محلی:
                  </span>
                  {availableIntervals.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onSnooze(task.id, mins);
                        onDismiss();
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-amber-500 hover:text-white text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      {toPersianDigits(mins)} دقیقه
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <span>قطع صدا و بستن</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
