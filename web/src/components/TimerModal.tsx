import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, X, Clock, Flame, Hourglass, CircleGauge, Sparkles } from 'lucide-react';
import { toPersianDigits } from '../calendar/jalali';
import { playAlarmSound } from '../services/soundService';

interface Props {
  isOpen: boolean;
  title: string;
  initialMinutes?: number;
  initialElapsedSeconds?: number;
  currentProgressPercent?: number;
  entityType?: 'TASK' | 'HABIT';
  onClose: () => void;
  onComplete: (elapsedSeconds: number, isFullyCompleted: boolean) => void;
}

export const TimerModal: React.FC<Props> = ({
  isOpen,
  title,
  initialMinutes = 25,
  initialElapsedSeconds = 0,
  currentProgressPercent = 0,
  entityType = 'TASK',
  onClose,
  onComplete,
}) => {
  const [mode, setMode] = useState<'COUNTDOWN' | 'STOPWATCH'>('COUNTDOWN');
  const [visualStyle, setVisualStyle] = useState<'HOURGLASS' | 'RING'>('HOURGLASS');
  const [targetMinutes, setTargetMinutes] = useState<number>(initialMinutes || 25);
  // Total elapsed seconds accumulated for this item (including prior runs today)
  const [accumulatedElapsed, setAccumulatedElapsed] = useState<number>(initialElapsedSeconds || 0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.max(0, (initialMinutes || 25) * 60 - (initialElapsedSeconds || 0))
  );
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(initialElapsedSeconds || 0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [showStopDecision, setShowStopDecision] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialMinutes > 0) {
      setTargetMinutes(initialMinutes);
      const targetSec = initialMinutes * 60;
      const initialElapsed = Math.min(targetSec, initialElapsedSeconds || 0);
      setAccumulatedElapsed(initialElapsed);
      setSecondsRemaining(Math.max(0, targetSec - initialElapsed));
      setMode('COUNTDOWN');
    } else {
      setMode('STOPWATCH');
      setAccumulatedElapsed(initialElapsedSeconds || 0);
      setStopwatchSeconds(initialElapsedSeconds || 0);
    }
    setIsActive(false);
    setShowStopDecision(false);
  }, [initialMinutes, initialElapsedSeconds, isOpen]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        if (mode === 'COUNTDOWN') {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsActive(false);
              setAccumulatedElapsed(targetMinutes * 60);
              // Play gentle bell on completion
              try {
                playAlarmSound('spring-sprout', 0.5);
              } catch {}
              setShowStopDecision(true);
              return 0;
            }
            return prev - 1;
          });
          setAccumulatedElapsed((prev) => prev + 1);
        } else {
          setStopwatchSeconds((prev) => prev + 1);
          setAccumulatedElapsed((prev) => prev + 1);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, targetMinutes]);

  if (!isOpen) return null;

  const handleSelectPreset = (mins: number) => {
    setMode('COUNTDOWN');
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setAccumulatedElapsed(0);
    setIsActive(false);
    setShowStopDecision(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFlipping(true);
    setShowStopDecision(false);
    setTimeout(() => setIsFlipping(false), 700);

    if (mode === 'COUNTDOWN') {
      setSecondsRemaining(targetMinutes * 60);
      setAccumulatedElapsed(0);
    } else {
      setStopwatchSeconds(0);
      setAccumulatedElapsed(0);
    }
  };

  const handlePauseOrStop = () => {
    if (isActive) {
      // Pause timer and open decision dialog
      setIsActive(false);
      setShowStopDecision(true);
    } else {
      // Resume / Start
      setShowStopDecision(false);
      setIsActive(true);
    }
  };

  // Option 1: Finish & Mark 100% complete
  const handleMark100PercentDone = () => {
    const elapsed = Math.max(accumulatedElapsed, 1);
    setIsActive(false);
    onComplete(elapsed, true);
    onClose();
  };

  // Option 2: Save partial progress (e.g. 45%) to resume later in the day
  const handleSavePartialProgress = () => {
    const elapsed = accumulatedElapsed;
    setIsActive(false);
    onComplete(elapsed, false);
    onClose();
  };

  // Option 3: Continue right now
  const handleResumeRunning = () => {
    setShowStopDecision(false);
    setIsActive(true);
  };

  const currentSeconds = mode === 'COUNTDOWN' ? secondsRemaining : stopwatchSeconds;
  const displayMins = Math.floor(currentSeconds / 60);
  const displaySecs = currentSeconds % 60;
  const timeFormatted = `${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;

  // Progress from 0% (start) to 100% (finished)
  const progress = mode === 'COUNTDOWN'
    ? Math.min(100, Math.max(0, ((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100))
    : (stopwatchSeconds % 60) * (100 / 60);

  // Hourglass geometry variables
  // Top bulb drains: sand level drops from 28 to 104
  const topSandY = 28 + ((104 - 28) * progress) / 100;
  // Bottom bulb fills: sand mound rises from 192 up to 118
  const bottomSandY = 192 - ((192 - 118) * progress) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-emerald-100/90 relative text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200/80">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>تایمر تمرکز و ذهن‌آگاهی جوانه</span>
          </span>
          <h3 className="text-base font-extrabold text-gray-900 mt-2 truncate px-4">{title}</h3>
        </div>

        {/* Visual Style & Mode Switcher Bar */}
        <div className="flex items-center justify-between gap-2 mb-4 bg-emerald-50/70 p-1 rounded-xl text-xs">
          {/* Mode switch */}
          <div className="flex flex-1 gap-1">
            <button
              type="button"
              onClick={() => { setMode('COUNTDOWN'); setIsActive(false); setSecondsRemaining(targetMinutes * 60); }}
              className={`flex-1 py-1 rounded-lg transition-all text-[11px] ${
                mode === 'COUNTDOWN' 
                  ? 'bg-white text-emerald-950 font-bold shadow-2xs' 
                  : 'text-emerald-700/80 hover:text-emerald-950'
              }`}
            >
              شمارش معکوس
            </button>
            <button
              type="button"
              onClick={() => { setMode('STOPWATCH'); setIsActive(false); setStopwatchSeconds(0); }}
              className={`flex-1 py-1 rounded-lg transition-all text-[11px] ${
                mode === 'STOPWATCH' 
                  ? 'bg-white text-emerald-950 font-bold shadow-2xs' 
                  : 'text-emerald-700/80 hover:text-emerald-950'
              }`}
            >
              کرنومتر
            </button>
          </div>

          {/* Visual representation toggle */}
          <div className="flex gap-1 border-r border-emerald-200/80 pr-2">
            <button
              type="button"
              onClick={() => setVisualStyle('HOURGLASS')}
              title="نمایش ساعت شنی آرامش‌بخش"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                visualStyle === 'HOURGLASS' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVisualStyle('RING')}
              title="نمایش حلقه دایره‌ای مدرن"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                visualStyle === 'RING' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CircleGauge className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Presets for Countdown */}
        {mode === 'COUNTDOWN' && (
          <div className="flex justify-center gap-1.5 mb-4">
            {[5, 15, 25, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPreset(mins)}
                className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                  targetMinutes === mins
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs scale-105'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {toPersianDigits(mins)} دقیقه
              </button>
            ))}
          </div>
        )}

        {/* --- VISUAL DISPLAY: HOURGLASS OR CIRCULAR RING --- */}
        {visualStyle === 'HOURGLASS' ? (
          /* Hourglass (ساعت شنی) Component */
          <div className="relative w-48 h-56 mx-auto flex flex-col items-center justify-center mb-4">
            <div 
              className={`w-36 h-48 relative transition-transform duration-700 ease-in-out ${
                isFlipping ? 'rotate-180' : ''
              }`}
            >
              <svg 
                viewBox="0 0 160 220" 
                className="w-full h-full filter drop-shadow-md"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {/* Linear gradient for warm golden sand */}
                  <linearGradient id="sandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>

                  {/* Gradient for glass highlights */}
                  <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                    <stop offset="30%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>

                  {/* Wood cap gradient */}
                  <linearGradient id="woodCapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D32" />
                    <stop offset="50%" stopColor="#1B5E20" />
                    <stop offset="100%" stopColor="#0F3813" />
                  </linearGradient>

                  {/* Clip path for top bulb of the glass */}
                  <clipPath id="topBulbClip">
                    <path d="M 36 24 C 36 65, 74 85, 76 110 L 84 110 C 86 85, 124 65, 124 24 Z" />
                  </clipPath>

                  {/* Clip path for bottom bulb of the glass */}
                  <clipPath id="bottomBulbClip">
                    <path d="M 76 110 C 74 135, 36 155, 36 196 L 124 196 C 124 155, 86 135, 84 110 Z" />
                  </clipPath>
                </defs>

                {/* Wooden / Emerald Cap: Top Stand */}
                <rect x="24" y="10" width="112" height="14" rx="7" fill="url(#woodCapGradient)" />
                <rect x="36" y="22" width="88" height="3" fill="#A7F3D0" opacity="0.6" />

                {/* Side Support Pillars */}
                <rect x="27" y="18" width="5" height="184" rx="2.5" fill="#1B5E20" opacity="0.35" />
                <rect x="128" y="18" width="5" height="184" rx="2.5" fill="#1B5E20" opacity="0.35" />

                {/* Glass Outer Glow / Background Tint */}
                <path
                  d="M 36 24 C 36 65, 74 85, 76 110 C 74 135, 36 155, 36 196 L 124 196 C 124 155, 86 135, 84 110 C 86 85, 124 65, 124 24 Z"
                  fill="#F0FDF4"
                  fillOpacity="0.75"
                  stroke="#A7F3D0"
                  strokeWidth="2.5"
                />

                {/* --- TOP BULB SAND (DRAINING) --- */}
                <g clipPath="url(#topBulbClip)">
                  {/* Draining sand body */}
                  <rect
                    x="20"
                    y={topSandY}
                    width="120"
                    height={Math.max(0, 110 - topSandY)}
                    fill="url(#sandGradient)"
                  />
                  {/* Subtle curved dip at the center of top sand */}
                  {progress < 96 && (
                    <path
                      d={`M 36 ${topSandY} Q 80 ${Math.min(108, topSandY + 6)} 124 ${topSandY}`}
                      fill="#F59E0B"
                      opacity="0.8"
                    />
                  )}
                </g>

                {/* --- BOTTOM BULB SAND (ACCUMULATING MOUND) --- */}
                <g clipPath="url(#bottomBulbClip)">
                  {/* Rising sand mound base */}
                  <rect
                    x="20"
                    y={bottomSandY}
                    width="120"
                    height={Math.max(0, 200 - bottomSandY)}
                    fill="url(#sandGradient)"
                  />
                  {/* Sand hill peak directly under the stream */}
                  {progress > 2 && (
                    <path
                      d={`M 40 196 Q 80 ${Math.max(110, bottomSandY - 12)} 120 196 Z`}
                      fill="url(#sandGradient)"
                    />
                  )}
                </g>

                {/* --- FLOWING SAND STREAM & PARTICLES IN THE NECK --- */}
                {isActive && progress < 100 && (
                  <g>
                    {/* Continuous vertical falling sand stream */}
                    <line
                      x1="80"
                      y1="108"
                      x2="80"
                      y2={Math.min(186, bottomSandY + 6)}
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Animated falling sand droplets */}
                    <circle cx="80" cy="116" r="1.5" fill="#FCD34D" className="animate-ping" style={{ animationDuration: '0.6s' }} />
                    <circle cx="80" cy="132" r="1.3" fill="#D97706" className="animate-pulse" />
                    <circle cx="80" cy="148" r="1.2" fill="#FCD34D" />
                  </g>
                )}

                {/* Glass Reflection & Crystal Highlights */}
                {/* Left bulb highlight curve */}
                <path
                  d="M 42 32 C 42 65, 68 85, 72 105"
                  stroke="url(#glassShine)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 42 188 C 42 160, 68 140, 72 115"
                  stroke="url(#glassShine)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Wooden / Emerald Cap: Bottom Stand */}
                <rect x="36" y="195" width="88" height="3" fill="#A7F3D0" opacity="0.6" />
                <rect x="24" y="196" width="112" height="14" rx="7" fill="url(#woodCapGradient)" />
              </svg>
            </div>

            {/* Time Overlay Badge */}
            <div className="mt-1 bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-full border border-emerald-200/90 shadow-xs flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-950 font-mono tracking-wider">
                {toPersianDigits(timeFormatted)}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500 animate-bounce' : 'text-gray-400'}`} />
                <span>{isActive ? 'جریان تمرکز' : 'متوقف'}</span>
              </span>
            </div>
          </div>
        ) : (
          /* Circular Ring Timer Display */
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#E8F5E9"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#10B981"
                strokeWidth="6"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-emerald-950 font-mono tracking-wider">
                {toPersianDigits(timeFormatted)}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-gray-400'}`} />
                {isActive ? 'در حال تمرکز...' : 'متوقف'}
              </span>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            title="چرخش ساعت شنی و شروع مجدد"
            className="p-3 text-gray-600 hover:text-emerald-800 bg-gray-100 hover:bg-emerald-50 rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs border border-gray-200"
          >
            <RotateCcw className={`w-5 h-5 ${isFlipping ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handlePauseOrStop}
            className={`px-6 py-3 font-extrabold rounded-full shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
              isActive 
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>توقف جریان ساعت شنی</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{accumulatedElapsed > 0 ? 'ادامه جریان تمرکز' : 'شروع جریان تمرکز'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setShowStopDecision(true);
            }}
            title="تعیین وضعیت پایان یا ذخیره نصفه"
            className="p-3 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* --- STOP / PAUSE DECISION MODAL OVERLAY --- */}
        {showStopDecision && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-5 flex flex-col justify-between text-right animate-fade-in rounded-3xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400">ساعت شنی متوقف شد</span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  {toPersianDigits(Math.round(progress))}% پیشرفت تمرکز
                </span>
              </div>

              <div className="mt-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-2 shadow-2xs">
                  <Hourglass className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-gray-900">
                  وضعیت انجام این {entityType === 'HABIT' ? 'عادت' : 'تسک'} چیست؟
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed px-2">
                  می‌توانید تسک را ۱۰۰٪ تکمیل شده ثبت کنید، یا به صورت «نصفه» ذخیره کنید تا در ادامه امروز تکمیل کنید. در پایان روز اگر خودتان تایید نکنید، همین درصد فعلی در تاریخچه ثبت می‌شود.
                </p>
              </div>

              <div className="mt-4 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-gray-700">
                  <span>مدت تمرکز سپری‌شده:</span>
                  <strong className="text-emerald-900 font-mono font-bold">
                    {toPersianDigits(Math.floor(accumulatedElapsed / 60))} دقیقه و {toPersianDigits(accumulatedElapsed % 60)} ثانیه
                  </strong>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round(progress))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3">
              {/* Option 1: 100% completed */}
              <button
                type="button"
                onClick={handleMark100PercentDone}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تسک تمام شد و ۱۰۰٪ انجام شد</span>
              </button>

              {/* Option 2: Keep partial progress and continue later */}
              <button
                type="button"
                onClick={handleSavePartialProgress}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-700" />
                <span>نصفه مانده (ذخیره پیشرفت {toPersianDigits(Math.round(progress))}% و ادامه در بقیه روز)</span>
              </button>

              {/* Option 3: Cancel and continue timer now */}
              <button
                type="button"
                onClick={handleResumeRunning}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ادامه دادن تمرکز در همین لحظه</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
