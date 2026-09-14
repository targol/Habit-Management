import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, X, Clock, Flame } from 'lucide-react';
import { toPersianDigits } from '../calendar/jalali';

interface Props {
  isOpen: boolean;
  title: string;
  initialMinutes?: number;
  onClose: () => void;
  onComplete: (elapsedSeconds: number) => void;
}

export const TimerModal: React.FC<Props> = ({
  isOpen,
  title,
  initialMinutes = 25,
  onClose,
  onComplete,
}) => {
  const [mode, setMode] = useState<'COUNTDOWN' | 'STOPWATCH'>('COUNTDOWN');
  const [targetMinutes, setTargetMinutes] = useState<number>(initialMinutes || 25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>((initialMinutes || 25) * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialMinutes > 0) {
      setTargetMinutes(initialMinutes);
      setSecondsRemaining(initialMinutes * 60);
      setMode('COUNTDOWN');
    } else {
      setMode('STOPWATCH');
    }
    setIsActive(false);
    setStopwatchSeconds(0);
  }, [initialMinutes, isOpen]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        if (mode === 'COUNTDOWN') {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsActive(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  if (!isOpen) return null;

  const handleSelectPreset = (mins: number) => {
    setMode('COUNTDOWN');
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    if (mode === 'COUNTDOWN') {
      setSecondsRemaining(targetMinutes * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const handleFinish = () => {
    const elapsed = mode === 'COUNTDOWN' 
      ? (targetMinutes * 60) - secondsRemaining
      : stopwatchSeconds;
    setIsActive(false);
    onComplete(elapsed);
    onClose();
  };

  const currentSeconds = mode === 'COUNTDOWN' ? secondsRemaining : stopwatchSeconds;
  const displayMins = Math.floor(currentSeconds / 60);
  const displaySecs = currentSeconds % 60;
  const timeFormatted = `${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;

  const progress = mode === 'COUNTDOWN'
    ? ((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl border border-emerald-100 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>تایمر تمرکز جوانه</span>
          </span>
          <h3 className="text-base font-bold text-gray-900 mt-2 truncate px-4">{title}</h3>
        </div>

        {/* Mode selector */}
        <div className="flex bg-emerald-50 p-1 rounded-xl mb-6 max-w-[240px] mx-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('COUNTDOWN'); setIsActive(false); setSecondsRemaining(targetMinutes * 60); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${mode === 'COUNTDOWN' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-emerald-700/70 hover:text-emerald-900'}`}
          >
            شمارش معکوس
          </button>
          <button
            type="button"
            onClick={() => { setMode('STOPWATCH'); setIsActive(false); setStopwatchSeconds(0); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${mode === 'STOPWATCH' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-emerald-700/70 hover:text-emerald-900'}`}
          >
            کرنومتر
          </button>
        </div>

        {/* Presets for Countdown */}
        {mode === 'COUNTDOWN' && (
          <div className="flex justify-center gap-2 mb-6">
            {[5, 15, 25, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPreset(mins)}
                className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                  targetMinutes === mins
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {toPersianDigits(mins)} دقیقه
              </button>
            ))}
          </div>
        )}

        {/* Circular Timer Display */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
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
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {isActive ? 'در حال تمرکز...' : 'متوقف'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            title="شروع مجدد"
            className="p-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                <span>توقف</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>شروع تمرکز</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleFinish}
            title="ثبت اتمام تمرکز و تکمیل"
            className="p-3 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
