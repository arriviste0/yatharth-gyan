import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Flame, Wind } from 'lucide-react';

const PRESETS = [5, 10, 20, 30, 45];

const AMBIENT_OPTIONS = [
  { id: 'none',  label: 'None' },
  { id: 'rain',  label: 'Rain' },
  { id: 'om',    label: 'ॐ Drone' },
  { id: 'bowl',  label: 'Bowl' },
];

/* ── Web Audio ambient generators ─────────────────────────────── */
function createAmbient(type, ctx) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5);
  master.connect(ctx.destination);

  if (type === 'rain') {
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    src.loop     = true;
    const filter = ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value         = 0.3;
    src.connect(filter);
    filter.connect(master);
    src.start();
    return { stop: () => { src.stop(); master.disconnect(); } };
  }

  if (type === 'om') {
    const oscs = [174, 348, 522].map((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type           = 'sine';
      osc.frequency.value = freq;
      gain.gain.value    = [0.12, 0.06, 0.03][i];
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return osc;
    });
    return { stop: () => { oscs.forEach((o) => o.stop()); master.disconnect(); } };
  }

  if (type === 'bowl') {
    let timeout;
    function ring() {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type            = 'sine';
      osc.frequency.value = 432;
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 4.5);
      timeout = setTimeout(ring, 6000);
    }
    ring();
    return { stop: () => { clearTimeout(timeout); master.disconnect(); } };
  }

  return { stop: () => master.disconnect() };
}

/* ── Bell at completion ───────────────────────────────────────── */
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [528, 480, 396].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.6;
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      osc.start(t);
      osc.stop(t + 2.5);
    });
  } catch {}
}

/* ── Box breathing visualizer (#36) ───────────────────────────── */
const BREATH_PHASES = [
  { label: 'Inhale',  duration: 4, scale: 1.3  },
  { label: 'Hold',    duration: 4, scale: 1.3  },
  { label: 'Exhale',  duration: 4, scale: 0.85 },
  { label: 'Hold',    duration: 4, scale: 0.85 },
];

function BreathingGuide() {
  const [phase, setPhase]   = useState(0);
  const [second, setSecond] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSecond((s) => {
        const dur = BREATH_PHASES[phase].duration;
        if (s + 1 >= dur) {
          setPhase((p) => (p + 1) % BREATH_PHASES.length);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const cur = BREATH_PHASES[phase];

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Breathing · 4-4-4-4</div>
      <div className="relative flex items-center justify-center"
        style={{
          width: 120, height: 120,
          transition: `transform ${cur.duration * 0.9}s ease-in-out`,
          transform: `scale(${cur.scale})`,
        }}>
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(91,107,175,0.12)', border: '2px solid rgba(91,107,175,0.3)' }} />
        <div className="text-center">
          <div className="text-white text-base font-semibold">{cur.label}</div>
          <div className="text-stone-500 text-xs">{cur.duration - second}s</div>
        </div>
      </div>
      <div className="flex gap-1">
        {BREATH_PHASES.map((p, i) => (
          <div key={i} className="w-6 h-1 rounded-full transition-all"
            style={{ background: i === phase ? '#5B6BAF' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Main FocusTimer ───────────────────────────────────────────── */
export default function FocusTimer({ onClose, onComplete }) {
  const [minutes,    setMinutes]    = useState(20);
  const [customMin,  setCustomMin]  = useState('');
  const [timeLeft,   setTimeLeft]   = useState(20 * 60);
  const [running,    setRunning]    = useState(false);
  const [finished,   setFinished]   = useState(false);
  const [ambient,    setAmbient]    = useState('none');
  const [label,      setLabel]      = useState('');
  const [breathing,  setBreathing]  = useState(false);
  const intervalRef   = useRef(null);
  const startedRef    = useRef(false);
  const audioRef      = useRef(null);
  const audioCtxRef   = useRef(null);

  useEffect(() => {
    if (!startedRef.current) setTimeLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            playBell();
            stopAmbient();
            onComplete?.({
              date: new Date().toISOString().slice(0, 10),
              duration: minutes,
              label: label || undefined,
              completedAt: new Date().toISOString(),
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      startedRef.current = true;
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  /* Ambient sound management */
  function startAmbient(type) {
    stopAmbient();
    if (type === 'none') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      audioRef.current = createAmbient(type, ctx);
    } catch {}
  }

  function stopAmbient() {
    try { audioRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    audioRef.current = null;
    audioCtxRef.current = null;
  }

  function toggleRunning() {
    const next = !running;
    setRunning(next);
    if (next && ambient !== 'none') startAmbient(ambient);
    else if (!next) stopAmbient();
  }

  function reset() {
    clearInterval(intervalRef.current);
    stopAmbient();
    setRunning(false);
    setFinished(false);
    setBreathing(false);
    startedRef.current = false;
    setTimeLeft(minutes * 60);
  }

  function selectPreset(m) {
    if (running) return;
    setMinutes(m);
    setCustomMin('');
    startedRef.current = false;
    setTimeLeft(m * 60);
    setFinished(false);
  }

  function applyCustom() {
    const val = parseInt(customMin, 10);
    if (!val || val < 1 || val > 180) return;
    if (running) return;
    setMinutes(val);
    startedRef.current = false;
    setTimeLeft(val * 60);
    setFinished(false);
  }

  /* Cleanup on unmount */
  useEffect(() => () => { clearInterval(intervalRef.current); stopAmbient(); }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const total = minutes * 60;
  const progress = total > 0 ? 1 - timeLeft / total : 1;
  const r = 58;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-3xl p-6 z-10 page-transition bg-white dark:bg-[#181926] border border-black/10 dark:border-white/10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F05A36]/15">
              <Flame size={15} className="text-[#F05A36]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18191E] dark:text-white">Focus Timer</div>
              <div className="text-[11px] text-stone-400 font-medium">Undivided presence</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-[#18191E] dark:hover:text-white bg-black/5 dark:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Session label (#35) */}
        {!startedRef.current && !finished && (
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Session label (optional)"
            className="w-full mb-4 text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#F05A36] transition-colors" />
        )}
        {startedRef.current && label && (
          <div className="text-xs text-stone-400 mb-3 text-center italic">{label}</div>
        )}

        {/* Preset pills */}
        <div className="flex gap-1.5 mb-2">
          {PRESETS.map((m) => (
            <button key={m} onClick={() => selectPreset(m)} disabled={running}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${running ? 'opacity-40 cursor-not-allowed' : ''} ${
                minutes === m && !customMin
                  ? 'bg-[#F05A36] text-white shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 text-stone-500 dark:text-stone-400'
              }`}>
              {m}m
            </button>
          ))}
        </div>

        {/* Custom duration (#34) */}
        {!running && (
          <div className="flex gap-2 mb-4">
            <input type="number" min="1" max="180" value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
              placeholder="Custom min"
              className="flex-1 text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#F05A36] transition-colors" />
            <button onClick={applyCustom}
              className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all">
              Set
            </button>
          </div>
        )}

        {/* Ambient sounds (#33) */}
        <div className="flex gap-1.5 mb-4">
          {AMBIENT_OPTIONS.map((a) => (
            <button key={a.id}
              onClick={() => {
                setAmbient(a.id);
                if (running) { stopAmbient(); if (a.id !== 'none') startAmbient(a.id); }
              }}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                ambient === a.id
                  ? 'bg-[#F05A36]/15 text-[#F05A36] border border-[#F05A36]/30'
                  : 'bg-black/5 dark:bg-white/5 text-stone-400 border border-transparent'
              }`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Breathing mode toggle (#36) */}
        <button onClick={() => setBreathing(!breathing)}
          className={`w-full flex items-center justify-center gap-1.5 mb-4 py-2 rounded-xl text-xs font-bold transition-all ${
            breathing
              ? 'bg-[#F05A36]/15 text-[#F05A36] border border-[#F05A36]/30'
              : 'bg-black/5 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-transparent'
          }`}>
          <Wind size={12} /> {breathing ? 'Hide breathing guide' : 'Show breathing guide'}
        </button>

        {/* Breathing visualizer */}
        {breathing && <BreathingGuide />}

        {/* Ring */}
        {!breathing && (
          <div className="flex justify-center mb-5">
            <div className="relative w-36 h-36">
              <svg width="144" height="144" className="-rotate-90">
                <circle cx="72" cy="72" r={r} fill="none" className="stroke-black/5 dark:stroke-white/10" strokeWidth="7" />
                <circle cx="72" cy="72" r={r} fill="none"
                  stroke={finished ? '#10B981' : '#F05A36'}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {finished ? (
                  <div className="text-center">
                    <div className="text-3xl mb-0.5">🔔</div>
                    <div className="text-xs text-emerald-500 font-bold">Done</div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-[#18191E] dark:text-white tabular-nums tracking-tight">
                      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 font-medium">
                      {running ? 'focusing…' : startedRef.current ? 'paused' : `${minutes} min`}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion message */}
        {finished && (
          <div className="mb-4 px-3 py-2.5 rounded-2xl text-center bg-emerald-500/10 border border-emerald-500/20">
            <p className="font-verse italic text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">
              "The action is yours. The fruit belongs to dharma."
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2.5">
          <button onClick={reset}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors bg-black/5 dark:bg-white/5 text-stone-400 hover:text-[#18191E] dark:hover:text-white" title="Reset">
            <RotateCcw size={15} />
          </button>

          {finished ? (
            <button onClick={onClose}
              className="btn-coral flex-1 h-12 text-sm font-bold">
              Close
            </button>
          ) : (
            <button onClick={toggleRunning}
              className="btn-coral flex-1 h-12 text-sm font-bold flex items-center justify-center gap-2 shadow-md">
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? 'Pause' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
