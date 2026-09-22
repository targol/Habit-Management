import { AlarmSoundItem } from '../types';

// Preset Gentle Instrumental Alarm Sounds (بدون کلام و بسیار آرامش‌بخش)
export const PRESET_ALARM_SOUNDS: AlarmSoundItem[] = [
  {
    id: 'serenity',
    title: 'آرامش صبحگاهی',
    description: 'هارپ و گلاکنسپیل پنتاتونیک ملایم و زلال',
    category: 'calm',
    type: 'synth',
    synthPattern: 'serenity',
    durationSeconds: 3.5,
  },
  {
    id: 'spring-sprout',
    title: 'جوانه بهار',
    description: 'ماریمبا و زنگوله‌های لطیف و باطراوت',
    category: 'nature',
    type: 'synth',
    synthPattern: 'spring-sprout',
    durationSeconds: 3.8,
  },
  {
    id: 'zen-bell',
    title: 'کاسه تبتی و زنگ ذن',
    description: 'طنین مدیتیشن با هارمونیک‌های عمیق ۴۳۲ هرتز',
    category: 'zen',
    type: 'synth',
    synthPattern: 'zen-bell',
    durationSeconds: 4.5,
  },
  {
    id: 'gentle-piano',
    title: 'پیانوی ملایم',
    description: 'آکوردهای گرم و آرامش‌بخش پیانوی آکوستیک',
    category: 'calm',
    type: 'synth',
    synthPattern: 'gentle-piano',
    durationSeconds: 4.0,
  },
  {
    id: 'forest-chime',
    title: 'نسیم بیشه‌زار',
    description: 'زنگوله‌های بادی بلورین و نوای باد ملایم',
    category: 'nature',
    type: 'synth',
    synthPattern: 'forest-chime',
    durationSeconds: 3.5,
  },
  {
    id: 'warm-sunrise',
    title: 'طلوع آفتاب',
    description: 'ملودی پرتوهای امیدبخش و شفاف صبحگاهی',
    category: 'chime',
    type: 'synth',
    synthPattern: 'warm-sunrise',
    durationSeconds: 3.6,
  },
];

let globalAudioCtx: AudioContext | null = null;
let currentActiveAudio: HTMLAudioElement | null = null;
let currentSynthStopFns: Array<() => void> = [];

function getAudioContext(): AudioContext {
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export function stopAllAlarmSounds(): void {
  // Stop HTML5 audio if playing
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
    } catch {}
    currentActiveAudio = null;
  }

  // Stop synthetic audio voices
  currentSynthStopFns.forEach((stopFn) => {
    try {
      stopFn();
    } catch {}
  });
  currentSynthStopFns = [];
}

/**
 * Procedural gentle acoustic synthesizer using Web Audio API.
 * Uses rich harmonics, sine/triangle blending, soft attack and exponential decays.
 */
function playSynthPattern(pattern: string, volume = 0.8): () => void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const clampedVol = Math.max(0.05, Math.min(1.0, volume));
    masterGain.gain.setValueAtTime(clampedVol, now);
    masterGain.connect(ctx.destination);

    const activeNodes: Array<{ stop: (time: number) => void; disconnect: () => void }> = [];

    // Helper to play a chime / bell / harp acoustic note
    const playNote = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType = 'sine',
      decaySpeed = 2.0,
      secondHarmonic = true
    ) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);

      // ADSR Envelope: Soft attack (15ms), exponential decay
      const startTime = now + startOffset;
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.45, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
      activeNodes.push(osc);

      // Add gentle acoustic overtone for warmth
      if (secondHarmonic) {
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, startTime);
        overGain.gain.setValueAtTime(0.0001, startTime);
        overGain.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
        overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.7);

        overtone.connect(overGain);
        overGain.connect(masterGain);
        overtone.start(startTime);
        overtone.stop(startTime + duration * 0.7);
        activeNodes.push(overtone);
      }
    };

    switch (pattern) {
      case 'serenity': {
        // Pentatonic Gentle Harp / Chime arpeggio: C4, E4, G4, A4, C5, E5
        const notes = [261.63, 329.63, 392.0, 440.0, 523.25, 659.25];
        notes.forEach((freq, idx) => {
          playNote(freq, idx * 0.35, 2.2, 'sine', 1.8, true);
        });
        break;
      }

      case 'spring-sprout': {
        // Bright playful marimba / bells: F#4, A#4, C#5, F5, G#5
        const notes = [369.99, 466.16, 554.37, 698.46, 830.61];
        notes.forEach((freq, idx) => {
          playNote(freq, idx * 0.28, 1.8, 'triangle', 2.5, true);
        });
        // Extra final resolution bell
        playNote(1108.73, 1.5, 2.0, 'sine', 1.5, true);
        break;
      }

      case 'zen-bell': {
        // Tibetan Bowl resonance (432Hz root, 216Hz undertone, 864Hz shimmer)
        const root = 432;
        playNote(root / 2, 0.0, 4.0, 'sine', 0.8, false);
        playNote(root, 0.05, 4.2, 'sine', 0.9, true);
        playNote(root * 1.5, 0.4, 3.5, 'sine', 1.1, true);
        playNote(root * 2, 0.8, 3.0, 'sine', 1.2, true);
        break;
      }

      case 'gentle-piano': {
        // Soft acoustic piano motif (Fmaj9 chord -> Cmaj7)
        // Chord 1
        playNote(349.23, 0.0, 2.5, 'triangle', 1.5, true); // F4
        playNote(440.0, 0.1, 2.5, 'sine', 1.5, true);     // A4
        playNote(523.25, 0.2, 2.8, 'sine', 1.5, true);    // C5
        playNote(659.25, 0.3, 3.0, 'sine', 1.3, true);    // E5
        // Chord 2
        playNote(261.63, 1.2, 2.8, 'triangle', 1.2, true); // C4
        playNote(392.0, 1.35, 2.6, 'sine', 1.2, true);     // G4
        playNote(493.88, 1.5, 2.8, 'sine', 1.2, true);     // B4
        playNote(523.25, 1.7, 3.2, 'sine', 1.0, true);     // C5
        break;
      }

      case 'forest-chime': {
        // Wind chimes cascading randomly like gentle breeze
        const chimeFreqs = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
        const times = [0.0, 0.22, 0.5, 0.85, 1.2, 1.6];
        times.forEach((t, i) => {
          playNote(chimeFreqs[i % chimeFreqs.length], t, 2.2, 'sine', 2.0, true);
        });
        break;
      }

      case 'warm-sunrise':
      default: {
        // Joyful warm rising harmony: D4, F#4, A4, D5
        const notes = [293.66, 369.99, 440.0, 587.33, 739.99];
        notes.forEach((f, i) => {
          playNote(f, i * 0.3, 2.4, 'sine', 1.7, true);
        });
        break;
      }
    }

    const stopFn = () => {
      try {
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        setTimeout(() => {
          activeNodes.forEach((node) => {
            try {
              node.stop(0);
              node.disconnect();
            } catch {}
          });
        }, 150);
      } catch {}
    };

    currentSynthStopFns.push(stopFn);
    return stopFn;
  } catch (err) {
    console.error('Synth sound playback error:', err);
    return () => {};
  }
}

/**
 * Plays the specified alarm sound (built-in synth or user-uploaded audio)
 */
export function playAlarmSound(
  soundId: string,
  customSounds: AlarmSoundItem[] = [],
  volume = 0.8
): () => void {
  stopAllAlarmSounds();

  // 1. Check custom uploaded sounds
  const custom = customSounds.find((s) => s.id === soundId);
  if (custom && custom.audioData) {
    try {
      const audio = new Audio(custom.audioData);
      audio.volume = Math.max(0.05, Math.min(1.0, volume));
      currentActiveAudio = audio;
      audio.play().catch((err) => {
        console.warn('Audio play prevented or failed:', err);
      });
      return () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
        if (currentActiveAudio === audio) {
          currentActiveAudio = null;
        }
      };
    } catch (e) {
      console.error('Custom sound playback failed, falling back to preset', e);
    }
  }

  // 2. Preset sounds
  const preset = PRESET_ALARM_SOUNDS.find((s) => s.id === soundId) || PRESET_ALARM_SOUNDS[0];
  return playSynthPattern(preset.synthPattern || 'serenity', volume);
}

/**
 * Helper to test/preview a sound briefly
 */
export function previewSound(
  soundId: string,
  customSounds: AlarmSoundItem[] = [],
  volume = 0.8
): () => void {
  return playAlarmSound(soundId, customSounds, volume);
}
