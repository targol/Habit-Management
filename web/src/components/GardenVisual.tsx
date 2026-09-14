import React, { useState } from 'react';
import { PlantState, Habit, Goal } from '../types';
import { PlantIcon } from './PlantIcon';
import { toPersianDigits, getTodayJalali, jalaliToFormattedString } from '../calendar/jalali';
import { Sparkles, Droplets, Sun, Wind, Flower2, Check, TreeDeciduous } from 'lucide-react';

interface Props {
  plantState: PlantState;
  habits: Habit[];
  goals: Goal[];
  onWaterHabit: (habitId: string) => void;
}

export const GardenVisual: React.FC<Props> = ({
  plantState,
  habits,
  goals,
  onWaterHabit,
}) => {
  const { stage, progressPercent, completedCount, totalCount } = plantState;
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'PANORAMA' | 'COMPACT'>('PANORAMA');
  const todayStr = jalaliToFormattedString(getTodayJalali());

  const handleWater = (habitId: string) => {
    setWateringId(habitId);
    onWaterHabit(habitId);
    setTimeout(() => {
      setWateringId(null);
    }, 1200);
  };

  // Weather and Garden Mood
  const gardenMood =
    progressPercent >= 100
      ? { text: 'باغچه در اوج شکوفایی و سرسبزی است', sunClass: 'text-amber-400 fill-amber-300 animate-spin-slow' }
      : progressPercent >= 60
      ? { text: 'هوای باغچه آفتابی و معتدل با نسیم رشد', sunClass: 'text-amber-400 fill-amber-300' }
      : progressPercent > 0
      ? { text: 'باران تلاش روزانه به خاک باغچه طراوت بخشیده', sunClass: 'text-amber-300' }
      : { text: 'باغچه در انتظار نخستین آب‌یاری و تلاش شماست', sunClass: 'text-amber-200' };

  return (
    <div className="bg-gradient-to-b from-sky-50 via-emerald-50/50 to-emerald-100/70 rounded-2xl border border-emerald-200/80 p-4 sm:p-6 shadow-xs relative overflow-hidden">
      {/* Top Garden Info & Mood */}
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
            <TreeDeciduous className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <span>باغچه شکوفایی من</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-full">
                پیشرفت امروز: {toPersianDigits(progressPercent)}٪
              </span>
            </h3>
            <p className="text-[11px] text-emerald-800/80 flex items-center gap-1.5 mt-0.5">
              <Sun className={`w-3.5 h-3.5 ${gardenMood.sunClass}`} />
              <span>{gardenMood.text}</span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white/80 p-1 rounded-xl border border-emerald-200 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('PANORAMA')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              viewMode === 'PANORAMA'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            باغچه گل و درخت
          </button>
          <button
            type="button"
            onClick={() => setViewMode('COMPACT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              viewMode === 'COMPACT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            جوانه متمرکز
          </button>
        </div>
      </div>

      {/* Panorama Garden Scene */}
      {viewMode === 'PANORAMA' ? (
        <div className="relative z-10 space-y-4">
          {/* Garden Outdoor Illustration Stage */}
          <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-emerald-200/90 shadow-inner bg-gradient-to-b from-[#bbf2f6] via-[#d4f8db] to-[#48a964]">
            {/* Sun in sky */}
            <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-90">
              <div className="w-10 h-10 rounded-full bg-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.8)] flex items-center justify-center border-2 border-amber-200">
                <div className="w-6 h-6 rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Clouds in sky */}
            <div className="absolute top-4 right-8 bg-white/70 backdrop-blur-xs rounded-full px-3 py-1 text-[9px] text-sky-800 flex items-center gap-1 shadow-xs border border-white/80">
              <Wind className="w-3 h-3 text-sky-600" />
              <span>نسیم باطراوت</span>
            </div>

            {/* Background gentle hills */}
            <svg
              className="absolute bottom-0 w-full h-32 pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 500 150"
            >
              <path
                d="M0,70 C150,20 250,90 500,40 L500,150 L0,150 Z"
                fill="#3da860"
                opacity="0.45"
              />
              <path
                d="M0,90 C120,50 350,110 500,75 L500,150 L0,150 Z"
                fill="#2e8c4d"
                opacity="0.65"
              />
              {/* Rich soil garden bed */}
              <path
                d="M0,115 C200,98 320,122 500,105 L500,150 L0,150 Z"
                fill="#1e6b37"
              />
            </svg>

            {/* Central Main Growth Tree (The Daily Bloom) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <div className="relative transform hover:scale-105 transition-transform duration-500">
                {/* Visual Tree / Plant based on stage */}
                {stage === 'SEED' && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-900/30 rounded-full border border-amber-800/40 flex items-center justify-center mb-1 shadow-inner">
                      <span className="text-2xl">🌱</span>
                    </div>
                    <span className="bg-black/30 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      بذر روز
                    </span>
                  </div>
                )}

                {stage === 'SPROUT' && (
                  <div className="text-center">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <PlantIcon type="برگ انجیری" size="md" />
                    </div>
                    <span className="bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      جوانه شکوفا
                    </span>
                  </div>
                )}

                {stage === 'SAPLING' && (
                  <div className="text-center">
                    <div className="w-20 h-20 flex items-center justify-center filter drop-shadow-md">
                      <PlantIcon type="بامبو" size="lg" />
                    </div>
                    <span className="bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      نهال استوار
                    </span>
                  </div>
                )}

                {stage === 'BUDDING' && (
                  <div className="text-center">
                    <div className="w-24 h-24 flex items-center justify-center filter drop-shadow-lg">
                      <PlantIcon type="بونسای" size="lg" />
                    </div>
                    <span className="bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      درختچه پرغنچه
                    </span>
                  </div>
                )}

                {(stage === 'FLOWERING' || stage === 'FULL_BLOOM') && (
                  <div className="text-center">
                    <div className="w-28 h-28 flex items-center justify-center filter drop-shadow-xl animate-bounce-subtle">
                      <PlantIcon type="درختچه زیتون" size="lg" />
                    </div>
                    <span className="bg-emerald-900/80 backdrop-blur-xs text-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border border-amber-300/50 shadow-md">
                      🌸 درخت بارور و شکوفا
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Decorative Flowers on garden ground */}
            <div className="absolute bottom-2 left-6 text-base opacity-90 animate-pulse">
              🌼
            </div>
            <div className="absolute bottom-4 left-16 text-xs opacity-80">
              🌿
            </div>
            <div className="absolute bottom-2 right-8 text-base opacity-90">
              🌷
            </div>
            <div className="absolute bottom-5 right-20 text-xs opacity-85">
              🌸
            </div>
            <div className="absolute bottom-1 right-36 text-sm opacity-90">
              🌻
            </div>

            {/* Butterfly */}
            <div className="absolute top-10 right-1/4 text-sm animate-bounce text-amber-100">
              🦋
            </div>
          </div>

          {/* Planted Flora in the Garden (باغچه گل‌ها و درختچه‌های فعال) */}
          <div className="bg-white/85 rounded-xl border border-emerald-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Flower2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>گیاهان کاشته‌شده در باغچه (عادت‌ها و اهداف شما)</span>
              </h4>
              <span className="text-[11px] text-gray-500">
                {toPersianDigits(habits.length)} گیاه فعال
              </span>
            </div>

            {habits.length === 0 ? (
              <p className="text-[11px] text-gray-500 text-center py-2">
                هنوز عادتی ثبت نشده است. با ثبت عادت جدید، گل‌ها و درختچه‌های متنوعی در باغچه بکارید!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {habits.map((h) => {
                  const isWateredToday = !!h.completionHistory[todayStr];
                  const streakCount = Object.values(h.completionHistory).filter(Boolean).length;
                  const isCurrentlyWatering = wateringId === h.id;

                  return (
                    <div
                      key={h.id}
                      className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center justify-between relative ${
                        isWateredToday
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                          : 'bg-white border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {/* Watering Splash Effect */}
                      {isCurrentlyWatering && (
                        <div className="absolute inset-0 bg-sky-500/20 rounded-xl flex items-center justify-center animate-ping pointer-events-none z-20">
                          <Droplets className="w-6 h-6 text-sky-600" />
                        </div>
                      )}

                      {/* Plant Icon Mascot */}
                      <div className="w-12 h-12 flex items-center justify-center my-1 filter drop-shadow-xs transform transition-transform hover:scale-110">
                        <PlantIcon type={h.plantType} size="md" />
                      </div>

                      {/* Plant Info */}
                      <div className="w-full">
                        <p className="text-[11px] font-bold text-gray-900 truncate" title={h.title}>
                          {h.title}
                        </p>
                        <p className="text-[9px] text-emerald-700 font-medium">
                          {h.plantType} • {toPersianDigits(streakCount)} روز رشد
                        </p>
                      </div>

                      {/* Water / Check Action */}
                      <button
                        type="button"
                        onClick={() => handleWater(h.id)}
                        className={`w-full mt-2 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isWateredToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {isWateredToday ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>آب‌یاری شد</span>
                          </>
                        ) : (
                          <>
                            <Droplets className="w-3 h-3 text-sky-600" />
                            <span>آب‌یاری امروز</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Compact Mode */
        <div className="bg-white/80 rounded-xl border border-emerald-200 p-4 text-center space-y-2">
          <div className="w-20 h-20 mx-auto flex items-center justify-center">
            <PlantIcon type="برگ انجیری" size="lg" />
          </div>
          <h4 className="text-xs font-bold text-gray-900">
            {completedCount >= totalCount && totalCount > 0
              ? 'باغچه امروز شما کاملاً شکوفا شده است!'
              : `${toPersianDigits(completedCount)} از ${toPersianDigits(totalCount)} تسک و عادت امروز انجام شده`}
          </h4>
          <div className="h-2 w-48 mx-auto bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
