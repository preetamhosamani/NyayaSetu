/**
 * frontend/src/App.jsx  —  NyaySetu v3.0 (Conversational Intake + Stitch UI)
 *
 * Design: Google Stitch — dark obsidian (#030712), glassmorphic cards,
 *         indigo/emerald accents, animated waveform, skeleton loaders,
 *         toast notifications, split-pane conversational chat + live form.
 *
 * Data: All state starts EMPTY. Only real user actions populate the UI.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Scale, Download, Play, Pause, Volume2,
  AlertCircle, CheckCircle2, Clock, Loader2, BookOpen,
  Phone, IndianRupee, User, MapPin, Building2, Calendar, CreditCard,
  Hash, Search, Globe, Activity, FileText, Shield, Sparkles,
  X, Upload, Send, MessageSquare, RefreshCw, Eye, ChevronDown, ChevronUp,
  FileCheck, HelpCircle, UploadCloud, Square,
} from 'lucide-react';

const API_BASE = '/api';

const LANGUAGES = [
  { code: 'kn-IN', label: 'ಕನ್ನಡ',  sub: 'Kannada+Eng', full: 'Kannada (kn-IN) · Code-Mixed' },
  { code: 'hi-IN', label: 'हिन्दी',  sub: 'Hinglish',    full: 'Hindi (hi-IN) · Hinglish' },
  { code: 'en-IN', label: 'English', sub: 'Indian Eng',  full: 'English (en-IN)' },
  { code: 'ta-IN', label: 'தமிழ்',  sub: 'Tanglish',    full: 'Tamil (ta-IN) · Tanglish' },
  { code: 'te-IN', label: 'తెలుగు', sub: 'Telugu+Eng',  full: 'Telugu (te-IN) · Code-Mixed' },
  { code: 'ml-IN', label: 'മലയാളം', sub: 'Malayalam+Eng', full: 'Malayalam (ml-IN) · Code-Mixed' },
  { code: 'mr-IN', label: 'मराठी',  sub: 'Marathi+Eng', full: 'Marathi (mr-IN) · Code-Mixed' },
  { code: 'bn-IN', label: 'বাংলা',  sub: 'Bengali+Eng', full: 'Bengali (bn-IN) · Code-Mixed' },
  { code: 'gu-IN', label: 'ગુજરાતી', sub: 'Gujarati+Eng', full: 'Gujarati (gu-IN) · Code-Mixed' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi+Eng', full: 'Punjabi (pa-IN) · Code-Mixed' },
];

// Baseline speed calibration: 1.0x in UI corresponds to standard 1.6x raw audio speed
const BASE_SPEED = 1.6;
const SPEED_OPTIONS = [
  { val: 0.5,  label: '0.5x' },
  { val: 0.75, label: '0.75x' },
  { val: 1.0,  label: '1.0x (Standard)' }, // Baseline in the center
  { val: 1.5,  label: '1.5x' },
  { val: 2.0,  label: '2.0x' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 16kHz PCM WAV ENCODER (Ensures 100% native compatibility with Gnani STT)
// ═══════════════════════════════════════════════════════════════════════════════

function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);             // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);              // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);     // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * 1 * 16/8)
  view.setUint16(32, 2, true);              // BlockAlign (1 * 16/8 = 2)
  view.setUint16(34, 16, true);             // BitsPerSample (16 bits)
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

const ENTITY_CONFIG = [
  { key: 'complainant_name',    label: 'Complainant Name',   icon: User        },
  { key: 'phone_number',        label: 'Phone Number',       icon: Phone       },
  { key: 'amount_lost',         label: 'Amount Lost',        icon: IndianRupee },
  { key: 'upi_id',              label: 'UPI / Wallet ID',    icon: Hash        },
  { key: 'email',               label: 'Email Address',      icon: Globe       },
  { key: 'bank_name',           label: 'Bank / Institution', icon: Building2   },
  { key: 'incident_date',       label: 'Incident Date',      icon: Calendar    },
  { key: 'incident_time',       label: 'Incident Time',      icon: Clock       },
  { key: 'incident_type',       label: 'Crime Category',     icon: AlertCircle },
  { key: 'fraud_method',        label: 'Fraud Method',       icon: Search      },
  { key: 'address',             label: 'Address',            icon: MapPin      },
  { key: 'suspect_description', label: 'Suspect Details',    icon: Shield      },
];

const SAMPLE_LEGAL =
  'Under Section 66C of the Information Technology Act, 2000, whoever fraudulently ' +
  'or dishonestly makes use of the electronic signature, password or any other unique ' +
  'identification feature of any other person, shall be punished with imprisonment of ' +
  'either description for a term which may extend to three years and shall also be ' +
  'liable to fine which may extend to rupees one lakh.';


// ═══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

function ToastContainer({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            'animate-slide-in flex items-start gap-3 px-4 py-3 rounded-xl',
            'shadow-2xl border backdrop-blur-xl pointer-events-auto text-sm font-medium',
            t.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/40 text-emerald-100'
              : t.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/40 text-rose-100'
              : 'bg-slate-900/90 border-slate-700/40 text-slate-100',
          ].join(' ')}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-current/40 hover:text-current transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// WAVEFORM VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════

const BAR_DELAYS = [0, 0.08, 0.16, 0.05, 0.13, 0.21, 0.03, 0.11, 0.19, 0.07,
                   0.15, 0.23, 0.01, 0.09, 0.17, 0.06, 0.14, 0.22, 0.04, 0.12,
                   0.20, 0.02, 0.10, 0.18];
const BAR_DURATIONS = [0.6, 0.75, 0.9, 0.65, 0.8, 0.7, 0.85, 0.6, 0.78, 0.68,
                       0.92, 0.72, 0.63, 0.88, 0.75, 0.6, 0.83, 0.70, 0.95, 0.65,
                       0.78, 0.60, 0.88, 0.73];

function WaveformVisualizer({ active }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-14 w-full">
      {BAR_DELAYS.map((delay, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-colors duration-300 ${
            active ? 'bg-rose-500' : 'bg-slate-700'
          }`}
          style={{
            height: '4px',
            animationName:            active ? 'waveBar' : 'none',
            animationDuration:        `${BAR_DURATIONS[i]}s`,
            animationDelay:           `${delay}s`,
            animationTimingFunction:  'ease-in-out',
            animationIterationCount:  'infinite',
            animationDirection:       'alternate',
          }}
        />
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════════════════

function SkeletonLine({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} rounded-lg bg-slate-800/70 animate-pulse`} />;
}

function ProcessingCard() {
  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
        <span className="text-sm font-semibold text-slate-300">Processing with Gnani Prisma STT…</span>
      </div>
      <SkeletonLine h="h-3" w="w-3/4" />
      <SkeletonLine h="h-16" />
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => <SkeletonLine key={i} h="h-10" />)}
      </div>
    </GlassCard>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [tab, setTab] = useState('grievance');
  const { toasts, push: toast, remove } = useToast();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans">
      <ToastContainer toasts={toasts} remove={remove} />
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-5 pb-24 space-y-4">
        <TabSwitcher active={tab} onChange={setTab} />
        {tab === 'grievance'
          ? <GrievanceFlow toast={toast} />
          : <SimplifierFlow toast={toast} />}
      </main>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function Header() {
  return (
    <header className="relative border-b border-slate-800/60">
      {/* Indian tricolour accent line */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#FF9933] via-white to-[#046A38]" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4">
        {/* Logo mark */}
        <div className="w-11 h-11 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6 text-indigo-400" />
        </div>

        {/* Wordmark */}
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-black tracking-tight text-white">NyaySetu</h1>
            <span className="text-lg font-light text-slate-500">न्यायसेतु</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium tracking-wide mt-0.5">
            Sovereign Voice-First Legal Bridge · Powered by Gnani.ai
          </p>
        </div>

        {/* API badges */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <ApiPill color="indigo" label="Prisma STT v3.0 · Code-Mixed" />
          <ApiPill color="emerald" label="Timbre TTS v2.5" />
        </div>
      </div>
    </header>
  );
}

function ApiPill({ color, label }) {
  const cls =
    color === 'indigo'
      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider ${cls}`}>
      {label}
    </span>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// TAB SWITCHER  —  floating pill
// ═══════════════════════════════════════════════════════════════════════════════

function TabSwitcher({ active, onChange }) {
  const tabs = [
    { id: 'grievance',  icon: Mic,      label: 'File Grievance',    sub: 'Voice → PDF'     },
    { id: 'simplifier', icon: BookOpen, label: 'Understand Notice', sub: 'Legal Simplifier' },
  ];
  return (
    <div className="flex gap-1 p-1 bg-slate-900/60 backdrop-blur border border-slate-800/60 rounded-2xl">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={[
              'flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl',
              'text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50',
            ].join(' ')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:block">{t.label}</span>
            <span className="sm:hidden">{t.sub}</span>
            {isActive && (
              <span className="hidden sm:block text-indigo-200/70 text-[11px] font-normal">
                · {t.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// GRIEVANCE FLOW  —  Conversational Intake (multi-turn chat + live form)
// ═══════════════════════════════════════════════════════════════════════════════

/** Mandatory fields with display metadata for the live form preview */
const INTAKE_FIELDS = [
  { key: 'complainant_name', label: 'Complainant Name',   icon: User        },
  { key: 'phone_number',     label: 'Phone Number',       icon: Phone       },
  { key: 'amount_lost',      label: 'Amount Lost',        icon: IndianRupee },
  { key: 'bank_name',        label: 'Bank Name',          icon: Building2   },
  { key: 'transaction_mode', label: 'Transaction Mode',   icon: CreditCard  },
  { key: 'incident_date',    label: 'Incident Date',      icon: Calendar    },
  { key: 'incident_type',    label: 'Crime Category',     icon: AlertCircle },
  { key: 'address',          label: 'Location / Town',    icon: MapPin      },
  { key: 'description',      label: 'Description',        icon: FileText    },
];

const GREETINGS = {
  'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನ್ಯಾಯಸೇತು ಕಾನೂನು ಸಹಾಯಕ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರನ್ನು ವಿವರಿಸಿ, ಅದನ್ನು ದಾಖಲಿಸಲು ನಾನು ನಿಮಗೆ ಹಂತ-ಹಂತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
  'hi-IN': 'नमस्ते! मैं न्यायसेतु कानूनी सहायक हूँ। कृपया अपनी शिकायत बताएं, मैं इसे दर्ज करने में आपकी मदद करूँगा।',
  'en-IN': 'Namaste! I am NyaySetu Legal Assistant. Please describe your complaint and I will guide you step-by-step to file it.',
  'ta-IN': 'வணக்கம்! நான் நியாயசேது சட்ட உதவியாளர். உங்கள் புகாரை விவரிக்கவும், அதை பதிவு செய்ய நான் உங்களுக்கு படிப்படியாக உதவுவேன்.',
  'te-IN': 'నమస్కారం! నేను న్యాయసేతు న్యాయ సహాయకుడిని. దయచేసి మీ ఫిర్యాదును వివరించండి, దాన్ని నమోదు చేయడంలో నేను మీకు దశలవారీగా సహాయం చేస్తాను.',
  'mr-IN': 'नमस्कार! मी न्यायसेतू कायदेशीर सहाय्यक आहे. कृपया आपली तक्रार सांगा, मी ती नोंदवण्यासाठी आपल्याला मदत करेन.',
  'bn-IN': 'নমস্কার! আমি ন্যায়সেতু আইনি সহকারী। অনুগ্রহ করে আপনার অভিযোগটি বলুন, আমি এটি নথিভুক্ত করতে আপনাকে সাহায্য করব।',
  'gu-IN': 'નમસ્તે! હું ન્યાયસેતુ કાનૂની સહાયક છું. કૃપા કરીને તમારી ફરિયાદ જણાવો, હું તેને નોંધવામાં તમારી મદદ કરીશ.',
  'ml-IN': 'നമസ്കാരം! ഞാൻ ന്യായസೇതു നിയമ സഹായിയാണ്. ദയവായി നിങ്ങളുടെ പരാതി വ്യക്തമാക്കുക, ഞാൻ സഹായിക്കാം.',
  'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਨਿਆਏਸੇਤੂ ਕਾਨੂੰਨੀ ਸਹਾਇਕ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸ਼ਿਕਾਇਤ ਦੱਸੋ, ਮੈਂ ਇਸਨੂੰ ਦਰਜ ਕਰਨ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।',
};

function GrievanceFlow({ toast }) {
  // ── Stable session ID for entire component lifetime ────────────────────────
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [language,         setLanguage]         = useState('kn-IN');
  const [messages,         setMessages]         = useState([{ role: 'assistant', text: GREETINGS['kn-IN'] }]);
  const [speechMultiplier, setSpeechMultiplier] = useState(1.0); // Standard natural baseline speed (1.0x = 1.6x raw rate)
  const [entities,         setEntities]         = useState({});
  const [missingFields,    setMissingFields]    = useState(INTAKE_FIELDS.map(f => f.key));
  const [isComplete,       setIsComplete]       = useState(false);
  const [inputText,        setInputText]        = useState('');
  const [chatLoading,      setChatLoading]      = useState(false);

  // ── Voice recording state ──────────────────────────────────────────────────
  const [recording,  setRecording]  = useState(false);
  const [recPaused,  setRecPaused]  = useState(false);
  const [recTimer,   setRecTimer]   = useState(0);

  // ── Audio playback controls (ChatGPT-style pause / resume / interrupt) ──────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const fallbackAudioRef = useRef(null);
  const recPausedRef     = useRef(false);

  // ── PDF state ──────────────────────────────────────────────────────────────
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const chatBottomRef   = useRef(null);
  const audioCtxRef     = useRef(null);
  const streamRef       = useRef(null);
  const processorRef    = useRef(null);
  const pcmChunksRef    = useRef([]);
  const timerRef        = useRef(null);
  const inputRef        = useRef(null);
  const activeSourceRef = useRef(null);
  const playerCtxRef    = useRef(null);

  // ── Auto-scroll chat on new messages ──────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Recording timer (pauses when user pauses mic) ──────────────────────────
  useEffect(() => {
    if (recording && !recPaused) {
      timerRef.current = setInterval(() => setRecTimer(n => n + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording, recPaused]);

  const fmtTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Stop/Interrupt Audio Playback (ChatGPT-style interruption) ─────────────
  const stopAudio = useCallback(() => {
    try {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        playerCtxRef.current.resume().catch(() => {});
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    } catch (_) {}
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // ── Pause Audio Playback ──────────────────────────────────────────────────
  const pauseAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'running') {
        await playerCtxRef.current.suspend();
        setIsPaused(true);
      } else if (fallbackAudioRef.current && !fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.pause();
        setIsPaused(true);
      }
    } catch (_) {}
  }, []);

  // ── Resume Audio Playback ─────────────────────────────────────────────────
  const resumeAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        await playerCtxRef.current.resume();
        setIsPaused(false);
      } else if (fallbackAudioRef.current && fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.play().catch(() => {});
        setIsPaused(false);
      }
    } catch (_) {}
  }, []);

  // ── Web Audio API Engine with 1.6x Baseline Multiplier & Pause/Resume ──────
  const playAudioB64 = useCallback(async (b64, customMultiplier) => {
    const mult = customMultiplier ?? speechMultiplier;
    const effectiveRate = mult * BASE_SPEED; // 1.0x baseline = 1.6x effective playback
    try {
      const raw = atob(b64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      // Stop any audio that is currently playing
      stopAudio();

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!playerCtxRef.current || playerCtxRef.current.state === 'closed') {
        playerCtxRef.current = new AudioCtx();
      }
      const ctx = playerCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // decodeAudioData with array buffer copy
      const audioBuffer = await ctx.decodeAudioData(arr.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = effectiveRate; // Web Audio API AudioParam — 100% deterministic & unresettable!
      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      source.start(0);
      activeSourceRef.current = source;
      setIsSpeaking(true);
      setIsPaused(false);
    } catch (err) {
      // Robust Fallback: HTML5 Audio with multiple event listeners enforcing playbackRate
      try {
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        const blob = new Blob([arr], { type: 'audio/wav' });
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        fallbackAudioRef.current = audio;
        audio.defaultPlaybackRate = effectiveRate;
        audio.playbackRate = effectiveRate;
        audio.onloadedmetadata = () => { audio.playbackRate = effectiveRate; };
        audio.onplay = () => { audio.playbackRate = effectiveRate; };
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          setIsPaused(false);
        };
        setIsSpeaking(true);
        setIsPaused(false);
      } catch (_) {}
    }
  }, [speechMultiplier, stopAudio]);

  // ── Send a text message to the chat-intake backend ─────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || chatLoading) return;
    // Silence assistant speech immediately when user submits an answer
    stopAudio();
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputText('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat-intake', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id: sessionId.current,
          message:    text,
          language,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setEntities(data.entities      ?? {});
      setMissingFields(data.missing_fields ?? []);
      setIsComplete(data.is_complete  ?? false);
      setMessages(prev => [...prev, {
        role:     'assistant',
        text:     data.assistant_response,
        audioB64: data.audio_base64,
        source:   data.tts_source,
      }]);
      if (data.audio_base64) playAudioB64(data.audio_base64);
    } catch (err) {
      toast(`Chat error: ${err.message}`, 'error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I could not process your message. Please try again.',
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, language, playAudioB64, stopAudio, toast]);

  // ── Voice: start recording (with instant interruption of AI speech) ───────
  const startRecording = useCallback(async () => {
    // Instantly interrupt / silence assistant speech so user can answer immediately
    stopAudio();
    pcmChunksRef.current = [];
    recPausedRef.current = false;
    setRecPaused(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = e => {
        if (!recPausedRef.current) {
          pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        }
      };
      src.connect(proc);
      proc.connect(ctx.destination);
      setRecording(true);
      setRecTimer(0);
      toast('Recording… speak your answer or use pause', 'info');
    } catch (err) {
      toast('Microphone access denied: ' + (err.message || 'grant permission'), 'error');
    }
  }, [stopAudio, toast]);

  // ── Recording Pause / Resume ──────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    recPausedRef.current = true;
    setRecPaused(true);
    toast('Recording paused', 'info');
  }, [toast]);

  const resumeRecording = useCallback(() => {
    recPausedRef.current = false;
    setRecPaused(false);
    toast('Recording resumed', 'info');
  }, [toast]);

  // ── Voice: stop recording, transcribe, then send transcript to chat ────────
  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setRecording(false);
    toast('Transcribing with Gnani Prisma STT…', 'info');

    try {
      processorRef.current?.disconnect();
      if (processorRef.current) processorRef.current.onaudioprocess = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      const sr = audioCtxRef.current?.sampleRate || 16000;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }

      let total = 0;
      for (const c of pcmChunksRef.current) total += c.length;
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of pcmChunksRef.current) { merged.set(c, off); off += c.length; }

      const wavBlob = encodeWAV(merged, sr);
      const form = new FormData();
      form.append('audio_file',    wavBlob, 'recording.wav');
      form.append('language_code', language);
      form.append('model',         'prisma-v3.0');

      setChatLoading(true);
      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!sttRes.ok) throw new Error(`STT HTTP ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.transcript || '';
      setChatLoading(false);

      if (!transcript.trim()) {
        toast('No speech detected — please try again.', 'error');
        return;
      }
      toast('Voice captured — sending to assistant…', 'success');
      await sendMessage(transcript);
    } catch (err) {
      setChatLoading(false);
      toast(`Voice error: ${err.message}`, 'error');
    }
  }, [recording, language, sendMessage, toast]);

  // ── PDF download ──────────────────────────────────────────────────────────
  const downloadPdf = async () => {
    if (!isComplete) {
      toast('Please answer all questions before downloading the PDF.', 'error');
      return;
    }
    setPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(entities),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `NyaySetu_Complaint_${Date.now()}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('Government-ready PDF downloaded!', 'success');
    } catch (err) {
      toast(`PDF download failed: ${err.message}`, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Language & Speed Handlers ──────────────────────────────────────────────
  const handleLanguageSelect = (code) => {
    setLanguage(code);
    if (messages.length <= 1) {
      setMessages([{ role: 'assistant', text: GREETINGS[code] || GREETINGS['kn-IN'] }]);
    }
  };

  const handleSpeedChange = (newMultiplier) => {
    setSpeechMultiplier(newMultiplier);
    const effectiveRate = newMultiplier * BASE_SPEED;
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.playbackRate.value = effectiveRate;
      } catch (_) {}
    }
    toast(`Voice speed set to ${newMultiplier}x`, 'info');
  };

  // ── Reset session ─────────────────────────────────────────────────────────
  const resetSession = async () => {
    stopAudio();
    try {
      await fetch(`/api/chat-intake/${sessionId.current}`, { method: 'DELETE' });
    } catch (_) {}
    // Generate a new session ID
    sessionId.current = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setMessages([{ role: 'assistant', text: GREETINGS[language] || GREETINGS['kn-IN'] }]);
    setEntities({});
    setMissingFields(INTAKE_FIELDS.map(f => f.key));
    setIsComplete(false);
    setInputText('');
    toast('Session reset — ready for a new complaint.', 'info');
  };

  const filledCount = INTAKE_FIELDS.length - missingFields.length;
  const progressPct = Math.round((filledCount / INTAKE_FIELDS.length) * 100);

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* Language + Speed + Reset row */}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <FieldLabel icon={Globe} label="Language" />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={chatLoading || recording}
                className={[
                  'flex flex-col items-center px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  language === lang.code
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50',
                ].join(' ')}
              >
                <span className="leading-tight">{lang.label}</span>
                <span className={`text-[9px] font-medium leading-tight ${language === lang.code ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {lang.sub}
                </span>
              </button>
            ))}
          </div>

          {/* Voice Speed Dropdown — 1.0x Standard baseline (1.6x effective rate) in the center */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <label htmlFor="voice-speed-select" className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Voice Speed:
            </label>
            <div className="relative">
              <select
                id="voice-speed-select"
                value={speechMultiplier}
                onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                className="bg-slate-900 text-slate-200 text-xs font-semibold px-2.5 py-1 pr-6 rounded-lg border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer appearance-none"
              >
                {SPEED_OPTIONS.map(opt => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={resetSession}
            disabled={chatLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      </GlassCard>

      {/* Split-pane layout: Chat + Live Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── LEFT: Conversational Chat ── */}
        <GlassCard className="flex flex-col" style={{ minHeight: '520px' }}>
          <FieldLabel icon={MessageSquare} label="NyaySetu Legal Assistant" />

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1" style={{ maxHeight: '360px' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-800/80 border border-slate-700/40 text-slate-200 rounded-bl-sm',
                  ].join(' ')}
                >
                  {msg.text}
                  {msg.source === 'gnani_timbre_tts' && (
                    <span className="ml-2 text-[9px] font-bold tracking-widest text-emerald-400 uppercase opacity-70">● TTS</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms'   }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* AI Voice Control Bar (ChatGPT Voice style Pause / Resume / Stop & Speak) */}
          {isSpeaking && (
            <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-0.5">
                  <span className={`w-1 h-3 rounded-full bg-indigo-400 ${isPaused ? '' : 'animate-bounce'}`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-1 h-4 rounded-full bg-indigo-400 ${isPaused ? '' : 'animate-bounce'}`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-1 h-2 rounded-full bg-indigo-400 ${isPaused ? '' : 'animate-bounce'}`} style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {isPaused ? 'AI Voice Paused' : 'AI Speaking…'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Pause / Resume Button */}
                <button
                  onClick={isPaused ? resumeAudio : pauseAudio}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow"
                  title={isPaused ? 'Resume AI Voice' : 'Pause AI Voice'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                {/* Stop & Speak Button (Instant Interrupt) */}
                <button
                  onClick={() => { stopAudio(); startRecording(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow"
                  title="Interrupt AI and talk right away"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Stop &amp; Speak</span>
                </button>

                <button
                  onClick={stopAudio}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                  title="Stop voice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Voice waveform & Mic Pause/Resume controls when user is recording */}
          {recording && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
              <WaveformVisualizer active={!recPaused} />
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-rose-400 font-mono tabular-nums">
                  {recPaused ? '⏸️ Recording Paused' : '🔴 Recording'} ({fmtTime(recTimer)})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={recPaused ? resumeRecording : pauseRecording}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 border border-slate-600/50 transition-all shadow"
                  >
                    {recPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{recPaused ? 'Resume Mic' : 'Pause Mic'}</span>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
            {/* Mic button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={chatLoading && !recording}
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                recording
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/50',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {recording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
              disabled={chatLoading || recording}
              placeholder={recording ? 'Recording…' : 'Type your reply or use the mic…'}
              className={[
                'flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl',
                'px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50',
                'transition-all disabled:opacity-50',
              ].join(' ')}
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage(inputText)}
              disabled={chatLoading || !inputText.trim() || recording}
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20',
                'transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {chatLoading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </GlassCard>

        {/* ── RIGHT: Live Form Preview ── */}
        <GlassCard className="flex flex-col" style={{ minHeight: '520px' }}>
          <div className="flex items-center justify-between mb-3">
            <FieldLabel icon={FileText} label="Live Form Preview" />
            <span className={[
              'text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border',
              isComplete
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400',
            ].join(' ')}>
              {isComplete ? '✓ COMPLETE' : `${filledCount}/${INTAKE_FIELDS.length} FIELDS`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Field cards */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '350px' }}>
            {INTAKE_FIELDS.map(({ key, label, icon: Icon }) => {
              const value   = entities[key];
              const filled  = !!value;
              return (
                <div
                  key={key}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-300',
                    filled
                      ? 'bg-emerald-950/30 border-emerald-700/30'
                      : 'bg-slate-800/40 border-slate-700/30',
                  ].join(' ')}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${filled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-slate-600 mb-0.5">{label}</p>
                    {filled
                      ? <p className={`text-sm font-medium text-emerald-300 ${key === 'description' ? 'line-clamp-3 leading-snug whitespace-pre-line' : 'truncate'}`}>{value}</p>
                      : <p className="text-sm text-slate-700 italic">Pending…</p>}
                  </div>
                  {filled && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Approve & Download button */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <button
              onClick={downloadPdf}
              disabled={!isComplete || pdfLoading}
              className={[
                'w-full flex items-center justify-center gap-2',
                'py-3.5 px-6 rounded-xl font-bold text-sm text-white',
                'transition-all duration-300',
                isComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/40',
              ].join(' ')}
            >
              {pdfLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF…</>
                : isComplete
                  ? <><Download className="w-5 h-5" /> Approve &amp; Download PDF</>
                  : <><Clock className="w-5 h-5" /> Waiting for all fields…</>}
            </button>
            {!isComplete && (
              <p className="text-center text-[11px] text-slate-700 mt-2">
                {missingFields.length} field{missingFields.length !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLIFIER FLOW  —  Google Stitch Dual-Column Document Simplifier & Assistant
// ═══════════════════════════════════════════════════════════════════════════════

function SimplifierFlow({ toast }) {
  // ── Language & Speed State ────────────────────────────────────────────────
  const [language,         setLanguage]         = useState('kn-IN');
  const [speechMultiplier, setSpeechMultiplier] = useState(1.0); // 1.0x baseline = 1.6x effective rate

  // ── Upload & Document Processing State ────────────────────────────────────
  const [selectedFile,       setSelectedFile]       = useState(null);
  const [isDragging,         setIsDragging]         = useState(false);
  const [uploading,          setUploading]          = useState(false);
  const [docResult,          setDocResult]          = useState(null);
  const [showExtractedText,  setShowExtractedText]  = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    key_allegations:     true,
    deadlines_dates:     true,
    financial_penalties: true,
    action_steps:        true,
  });

  // ── Document Context Chat State ───────────────────────────────────────────
  const [chatMessages,     setChatMessages]     = useState([]);
  const [chatInput,        setChatInput]        = useState('');
  const [chatLoading,      setChatLoading]      = useState(false);

  // ── Voice Recording for Chat ──────────────────────────────────────────────
  const [recording,        setRecording]        = useState(false);
  const [recTimer,         setRecTimer]         = useState(0);

  // ── Audio Playback Controls (Pause / Resume / Stop) ───────────────────────
  const [playingAudioId,   setPlayingAudioId]   = useState(null); // 'summary' or message id
  const [isAudioPaused,    setIsAudioPaused]    = useState(false);
  const playerCtxRef       = useRef(null);
  const activeSourceRef    = useRef(null);
  const fallbackAudioRef   = useRef(null);

  // ── Recording Refs ────────────────────────────────────────────────────────
  const audioCtxRef        = useRef(null);
  const streamRef          = useRef(null);
  const processorRef       = useRef(null);
  const pcmChunksRef       = useRef([]);
  const fileInputRef       = useRef(null);
  const chatBottomRef      = useRef(null);
  const timerIntervalRef   = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Recording timer
  useEffect(() => {
    if (recording) {
      setRecTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setRecTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recording]);

  // ── Stop Any Playing Audio ────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    try {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        playerCtxRef.current.resume().catch(() => {});
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    } catch (_) {}
    setPlayingAudioId(null);
    setIsAudioPaused(false);
  }, []);

  // ── Pause Audio Playback ──────────────────────────────────────────────────
  const pauseAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'running') {
        await playerCtxRef.current.suspend();
        setIsAudioPaused(true);
      } else if (fallbackAudioRef.current && !fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.pause();
        setIsAudioPaused(true);
      }
    } catch (_) {}
  }, []);

  // ── Resume Audio Playback ─────────────────────────────────────────────────
  const resumeAudio = useCallback(async () => {
    try {
      if (playerCtxRef.current && playerCtxRef.current.state === 'suspended') {
        await playerCtxRef.current.resume();
        setIsAudioPaused(false);
      } else if (fallbackAudioRef.current && fallbackAudioRef.current.paused) {
        fallbackAudioRef.current.play().catch(() => {});
        setIsAudioPaused(false);
      }
    } catch (_) {}
  }, []);

  // ── Play Audio via Web Audio API ──────────────────────────────────────────
  const playAudioB64 = useCallback(async (b64, audioId) => {
    if (!b64) return;
    const effectiveRate = speechMultiplier * BASE_SPEED;
    stopAudio();

    try {
      const raw = atob(b64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!playerCtxRef.current || playerCtxRef.current.state === 'closed') {
        playerCtxRef.current = new AudioCtx();
      }
      const ctx = playerCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arr.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = effectiveRate;
      source.connect(ctx.destination);
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
          setPlayingAudioId(null);
          setIsAudioPaused(false);
        }
      };
      source.start(0);
      activeSourceRef.current = source;
      setPlayingAudioId(audioId);
      setIsAudioPaused(false);
    } catch (err) {
      try {
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        const blob = new Blob([arr], { type: 'audio/wav' });
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        fallbackAudioRef.current = audio;
        audio.defaultPlaybackRate = effectiveRate;
        audio.playbackRate = effectiveRate;
        audio.onloadedmetadata = () => { audio.playbackRate = effectiveRate; };
        audio.onplay = () => { audio.playbackRate = effectiveRate; };
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setPlayingAudioId(null);
          setIsAudioPaused(false);
        };
        setPlayingAudioId(audioId);
        setIsAudioPaused(false);
      } catch (_) {}
    }
  }, [speechMultiplier, stopAudio]);

  const toggleAudio = (b64, audioId) => {
    if (playingAudioId === audioId) {
      if (isAudioPaused) {
        resumeAudio();
      } else {
        pauseAudio();
      }
    } else {
      playAudioB64(b64, audioId);
    }
  };

  // ── Document Upload & Extraction ──────────────────────────────────────────
  const handleUploadFile = async (file, targetLang) => {
    if (!file) return;

    // Validate extension
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'];
    if (!validExts.includes(ext)) {
      toast('Unsupported file format. Please upload a PDF, PNG, or JPG document.', 'error');
      return;
    }

    // Validate size (15 MB)
    if (file.size > 15 * 1024 * 1024) {
      toast('File size exceeds maximum limit of 15 MB.', 'error');
      return;
    }

    stopAudio();
    setSelectedFile(file);
    setUploading(true);
    setDocResult(null);
    setChatMessages([]);
    toast(`Analyzing ${file.name} with PyMuPDF & OCR…`, 'info');

    const form = new FormData();
    form.append('file', file);
    form.append('language', targetLang || language);

    try {
      const res = await fetch('/api/upload-legal-document', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDocResult(data);

      // Set initial welcoming assistant message in chat
      const welcomeText = language.startsWith('kn')
        ? `ನಾನು ನಿಮ್ಮ ಕಾನೂನು ನೋಟಿಸ್ (${file.name}) ಅನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ. ನೋಟಿಸ್‌ನ ಉದ್ದೇಶ, ಗಡುವು ದಿನಾಂಕ, ಅಥವಾ ಶಿಫಾರಸು ಮಾಡಲಾದ ಮುಂದಿನ ಕ್ರಮಗಳ ಬಗ್ಗೆ ನೀವು ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು.`
        : language.startsWith('hi')
        ? `मैंने आपका कानूनी नोटिस (${file.name}) विश्लेषित कर लिया है। आप नोटिस के कारण, समय-सीमा, या कानूनी सलाह के बारे में कोई भी प्रश्न पूछ सकते हैं।`
        : `I have analyzed your legal notice (${file.name}). You can ask me any contextual questions about the allegations, deadlines, penalties, or recommended next steps.`;

      setChatMessages([{
        id: 'msg_welcome',
        role: 'assistant',
        text: welcomeText,
        audio_base64: null,
      }]);

      // Automatically play voice summary if available
      if (data.audio_base64) {
        playAudioB64(data.audio_base64, 'summary');
      }

      toast(
        data.tts_source === 'gnani_timbre_tts'
          ? 'Notice simplified with Gnani Timbre TTS ✓'
          : 'Notice analyzed & structured successfully ✓',
        'success'
      );
    } catch (err) {
      toast(`Upload error: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => {
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // ── Load Sample Notice (IT Act Section 66C) ───────────────────────────────
  const handleLoadSample = () => {
    const sampleBlob = new Blob([SAMPLE_LEGAL], { type: 'text/plain' });
    const sampleFile = new File([sampleBlob], 'IT_Act_Section_66C_Notice.txt', { type: 'text/plain' });
    handleUploadFile(sampleFile);
  };

  // ── Send Contextual Chat Message ──────────────────────────────────────────
  const sendChatMessage = async (queryText) => {
    const textToSend = (queryText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    stopAudio();
    const userMsgId = `user_${Date.now()}`;
    const userMsg = { id: userMsgId, role: 'user', text: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const docId = docResult?.document_id || 'doc_current';
      const res = await fetch('/api/chat-document', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id:   docId,
          user_message:  textToSend,
          language_code: language,
          history:       chatMessages.slice(-6).map(m => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const asstMsgId = `asst_${Date.now()}`;
      const asstMsg = {
        id:           asstMsgId,
        role:         'assistant',
        text:         data.response_text,
        audio_base64: data.audio_base64,
        tts_source:   data.tts_source,
      };

      setChatMessages(prev => [...prev, asstMsg]);

      // Automatically play response audio
      if (data.audio_base64) {
        playAudioB64(data.audio_base64, asstMsgId);
      }
    } catch (err) {
      toast(`Chat error: ${err.message}`, 'error');
      setChatMessages(prev => [...prev, {
        id:   `err_${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, I encountered an error searching the document. Please try again.',
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Voice Input Recording (Gnani Prisma STT) ──────────────────────────────
  const startRecording = async () => {
    stopAudio();
    pcmChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;
      proc.onaudioprocess = e => {
        pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      src.connect(proc);
      proc.connect(ctx.destination);
      setRecording(true);
      toast('Recording… speak your question about the notice', 'info');
    } catch (err) {
      toast('Microphone access denied: ' + (err.message || 'grant permission'), 'error');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(false);
    toast('Transcribing with Gnani Prisma STT…', 'info');

    try {
      processorRef.current?.disconnect();
      if (processorRef.current) processorRef.current.onaudioprocess = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      const sr = audioCtxRef.current?.sampleRate || 16000;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }

      let total = 0;
      for (const c of pcmChunksRef.current) total += c.length;
      const merged = new Float32Array(total);
      let off = 0;
      for (const c of pcmChunksRef.current) { merged.set(c, off); off += c.length; }

      const wavBlob = encodeWAV(merged, sr);
      const form = new FormData();
      form.append('audio_file',    wavBlob, 'question.wav');
      form.append('language_code', language);
      form.append('model',         'prisma-v3.0');

      setChatLoading(true);
      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!sttRes.ok) throw new Error(`STT HTTP ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.transcript || '';
      setChatLoading(false);

      if (!transcript.trim()) {
        toast('No speech detected — please try again.', 'error');
        return;
      }
      toast('Transcribed question captured — querying document…', 'success');
      await sendChatMessage(transcript);
    } catch (err) {
      setChatLoading(false);
      toast(`Voice query error: ${err.message}`, 'error');
    }
  };

  // ── Language Select ───────────────────────────────────────────────────────
  const handleLanguageSelect = (code) => {
    setLanguage(code);
    if (selectedFile) {
      handleUploadFile(selectedFile, code);
    }
  };

  // ── Reset All ─────────────────────────────────────────────────────────────
  const clearAll = () => {
    stopAudio();
    setSelectedFile(null);
    setDocResult(null);
    setChatMessages([]);
    setChatInput('');
    setShowExtractedText(false);
    toast('Document session cleared.', 'info');
  };

  // Category Configuration
  const categoryConfigs = [
    {
      key: 'key_allegations',
      icon: AlertCircle,
      accent: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      defaultTitle: 'Key Allegations / Notice Intent',
    },
    {
      key: 'deadlines_dates',
      icon: Clock,
      accent: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      defaultTitle: 'Deadlines & Important Dates',
    },
    {
      key: 'financial_penalties',
      icon: Scale,
      accent: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
      defaultTitle: 'Financial Demands & Penalties',
    },
    {
      key: 'action_steps',
      icon: Shield,
      accent: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      defaultTitle: 'Recommended Action Steps',
    },
  ];

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Quick suggestion chips
  const suggestions = [
    { label: 'Why was this sent?',  query: 'Why was this notice sent to me?' },
    { label: 'Response deadline?', query: 'What is the deadline to respond to this notice?' },
    { label: 'Action to take?',    query: 'What legal action should I take right now?' },
    { label: 'Fines & penalties?', query: 'Are there any penalties, fines, or jail terms mentioned?' },
  ];

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* ── Top Control Bar: Language, Audio Speed & Reset ── */}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <FieldLabel icon={Globe} label="Language" />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={uploading || chatLoading || recording}
                className={[
                  'flex flex-col items-center px-2.5 py-1 rounded-xl text-xs font-semibold transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  language === lang.code
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50',
                ].join(' ')}
              >
                <span className="leading-tight">{lang.label}</span>
                <span className={`text-[9px] font-medium leading-tight ${language === lang.code ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {lang.sub}
                </span>
              </button>
            ))}
          </div>

          {/* Voice Speed Dropdown — 1.0x baseline = 1.6x raw rate */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <label htmlFor="simplifier-voice-speed" className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Voice Speed:
            </label>
            <div className="relative">
              <select
                id="simplifier-voice-speed"
                value={speechMultiplier}
                onChange={e => setSpeechMultiplier(parseFloat(e.target.value))}
                className="bg-slate-900 text-slate-200 text-xs font-semibold px-2.5 py-1 pr-6 rounded-lg border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer appearance-none"
              >
                {SPEED_OPTIONS.map(opt => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {(selectedFile || docResult) && (
            <button
              onClick={clearAll}
              disabled={uploading || chatLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all disabled:opacity-40"
            >
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* ── Dual-Column Google Stitch Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN (7 cols): Document Upload, Preview & Categorized Breakdown
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-4">

          {/* 1. Drag-and-Drop Upload Container */}
          <GlassCard>
            <FieldLabel icon={UploadCloud} label="Upload Legal Notice / Document" />

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadFile(e.target.files[0]);
                }
              }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="hidden"
            />

            {/* Drag & Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'mt-3 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center',
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-700/70 hover:border-indigo-500/50 bg-slate-800/30 hover:bg-slate-800/50',
              ].join(' ')}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                {selectedFile ? selectedFile.name : 'Drag & drop legal notice (PDF, PNG, JPG)'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB · Click or drop to replace`
                  : 'or click to browse from device (Max 15MB)'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-[10px] font-semibold text-slate-400">PDF</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-[10px] font-semibold text-slate-400">JPG</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-[10px] font-semibold text-slate-400">PNG</span>
              </div>
            </div>

            {/* Instant Sample Loader Button */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Notice — IT Act Section 66C
              </button>

              {selectedFile && !uploading && (
                <button
                  type="button"
                  onClick={() => handleUploadFile(selectedFile)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-analyze
                </button>
              )}
            </div>
          </GlassCard>

          {/* 2. Loading Skeleton while OCR / parsing is active */}
          {uploading && (
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Extracting & Structuring Legal Document…
                  </p>
                  <p className="text-xs text-slate-500">
                    PyMuPDF digital extraction / OCR engine & Gnani Timbre TTS voice synthesis
                  </p>
                </div>
              </div>
              <SkeletonLine h="h-4" w="w-3/4" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <SkeletonLine h="h-20" />
                <SkeletonLine h="h-20" />
                <SkeletonLine h="h-20" />
                <SkeletonLine h="h-20" />
              </div>
            </GlassCard>
          )}

          {/* 3. Document Overview Card (Preview & Metadata) */}
          {docResult && !uploading && (
            <GlassCard className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel icon={FileCheck} label="Document Overview & Source" />
                <SourceBadge source={docResult.tts_source} tts />
              </div>

              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                    {docResult.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 uppercase">
                    {docResult.file_type || 'DOC'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {Math.round(docResult.file_size / 1024)} KB
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[10px] text-indigo-400 font-semibold">
                    {docResult.metadata?.method || 'PyMuPDF Engine'}
                  </span>
                </div>
              </div>

              {/* Collapsible Extracted Text Viewer */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowExtractedText(prev => !prev)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  {showExtractedText ? 'Hide Extracted Full Text' : 'View Extracted Full Text'}
                  {showExtractedText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showExtractedText && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                    {docResult.extracted_text || 'No text extracted.'}
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* 4. Initial Voice Summary Player */}
          {docResult?.audio_base64 && !uploading && (
            <GlassCard className="flex items-center gap-4 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-slate-900/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAudio(docResult.audio_base64, 'summary')}
                  className={[
                    'w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all',
                    playingAudioId === 'summary'
                      ? isAudioPaused
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 ring-2 ring-amber-400'
                        : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30',
                  ].join(' ')}
                  title={
                    playingAudioId === 'summary'
                      ? isAudioPaused
                        ? 'Resume Plain-Language Summary'
                        : 'Pause Plain-Language Summary'
                      : 'Listen to Plain-Language Summary'
                  }
                >
                  {playingAudioId === 'summary' && !isAudioPaused
                    ? <Pause className="w-5 h-5 text-white" />
                    : <Play  className="w-5 h-5 text-white ml-0.5" />}
                </button>
                {playingAudioId === 'summary' && (
                  <button
                    type="button"
                    onClick={stopAudio}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 shadow transition-all"
                    title="Stop playback"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {playingAudioId === 'summary'
                    ? isAudioPaused
                      ? 'Plain-Language Summary Paused'
                      : 'Playing Plain-Language Summary…'
                    : 'Listen to Plain-Language Summary'}
                  {playingAudioId === 'summary' && !isAudioPaused && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Gnani Timbre TTS · Voice: Nalini · {LANGUAGES.find(l => l.code === (docResult.language || language))?.label || 'Regional'}
                </p>
              </div>
              <Volume2 className={`w-5 h-5 shrink-0 transition-colors ${
                playingAudioId === 'summary' && !isAudioPaused ? 'text-amber-400 animate-pulse' : 'text-slate-600'
              }`} />
            </GlassCard>
          )}

          {/* 5. Categorized Legal Breakdown (4 Structured Categories) */}
          {docResult?.structured_summary && !uploading && (
            <div className="space-y-3">
              {categoryConfigs.map(cat => {
                const title = docResult.structured_summary.category_titles?.[cat.key] || cat.defaultTitle;
                const points = docResult.structured_summary[cat.key] || [];
                const isExpanded = expandedCategories[cat.key];

                if (!points.length) return null;

                const IconComponent = cat.icon;

                return (
                  <GlassCard key={cat.key} className="space-y-3 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.key)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cat.badge}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                          {title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.badge}`}>
                          {points.length} {points.length === 1 ? 'item' : 'items'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <ul className="space-y-2 pt-1 border-t border-slate-800/60">
                        {points.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-xs sm:text-sm text-slate-200 leading-relaxed"
                          >
                            <span className="text-indigo-400 font-bold text-xs mt-0.5 shrink-0">
                              {idx + 1}.
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN (5 cols): Interactive Document Assistant Chat
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="flex flex-col" style={{ minHeight: '580px' }}>
            
            {/* Assistant Header with Context Pill */}
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
              <FieldLabel icon={MessageSquare} label="Document Assistant" />
              {docResult ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Context Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-500">
                  Awaiting Upload
                </span>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            {docResult && !uploading && (
              <div className="py-2.5 border-b border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendChatMessage(sug.query)}
                      disabled={chatLoading || recording}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/70 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/40 transition-all disabled:opacity-40"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages Scroll Container */}
            <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1" style={{ maxHeight: '380px' }}>
              
              {/* Empty state when no document is uploaded */}
              {!docResult && !uploading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-3">
                    <HelpCircle className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Document Q&amp;A Assistant</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                    Upload or drag a legal notice on the left. The assistant will answer contextual questions strictly based on the extracted text.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="mt-4 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Try with Sample Notice
                  </button>
                </div>
              )}

              {/* Chat Thread */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={[
                      'max-w-[88%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-800/80 border border-slate-700/40 text-slate-200 rounded-bl-sm',
                    ].join(' ')}
                  >
                    <div>{msg.text}</div>

                    {/* Audio playback button for assistant response */}
                    {msg.role === 'assistant' && msg.audio_base64 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAudio(msg.audio_base64, msg.id)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {playingAudioId === msg.id ? (
                            isAudioPaused ? (
                              <>
                                <Play className="w-3 h-3 text-amber-400 fill-current" />
                                <span className="text-amber-400 font-bold">Resume voice</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 text-amber-400 fill-current" />
                                <span className="text-amber-400 font-bold">Pause voice</span>
                              </>
                            )
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Listen in {LANGUAGES.find(l => l.code === language)?.label || 'Regional'}</span>
                            </>
                          )}
                        </button>
                        {msg.tts_source === 'gnani_timbre_tts' && (
                          <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">● TTS</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Skeleton Indicator */}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar: Voice STT + Text Query */}
            <div className="pt-3 border-t border-slate-800/70">
              <div className="flex items-center gap-2">

                {/* Voice Input Trigger (Gnani Prisma STT) */}
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={uploading || chatLoading}
                  className={[
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    recording
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60',
                  ].join(' ')}
                  title={recording ? `Recording (${recTimer}s) — click to send` : 'Ask question by voice (Prisma STT)'}
                >
                  {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  disabled={uploading || chatLoading || recording}
                  placeholder={
                    recording
                      ? `Recording speech (${recTimer}s)… click mic to finish`
                      : docResult
                      ? 'Ask any question about this notice…'
                      : 'Upload document first to ask questions…'
                  }
                  className={[
                    'flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl',
                    'px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50',
                    'disabled:opacity-40 transition-all',
                  ].join(' ')}
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim() || chatLoading || recording}
                  className={[
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                    'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/25',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  {chatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Status footer for audio or recording */}
              <div className="flex items-center justify-between mt-2.5 px-1 min-h-[30px]">
                <div className="flex items-center gap-2 min-w-0">
                  {recording ? (
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Recording voice question ({recTimer}s)…</span>
                    </div>
                  ) : playingAudioId ? (
                    isAudioPaused ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Voice response paused</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-3.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Playing voice response…</span>
                      </div>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      Powered by Gnani Prisma STT &amp; Timbre TTS
                    </span>
                  )}
                </div>

                {playingAudioId && (
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Interactive Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={isAudioPaused ? resumeAudio : pauseAudio}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-md transition-all ${
                        isAudioPaused
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-1 ring-amber-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                      }`}
                      title={isAudioPaused ? 'Resume voice playback' : 'Pause voice playback'}
                    >
                      {isAudioPaused ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Stop Button to completely cancel */}
                    <button
                      type="button"
                      onClick={stopAudio}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all"
                      title="Stop audio playback"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </GlassCard>
        </div>

      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// SHARED DESIGN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Glassmorphic card — the core container unit */
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={[
        'bg-slate-900/80 backdrop-blur-xl',
        'border border-slate-800/80 rounded-2xl shadow-2xl',
        'p-5',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/** Section field label with icon */
function FieldLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-slate-500">
      <Icon className="w-3.5 h-3.5 text-indigo-400" />
      {label}
    </div>
  );
}

/** Source indicator badge */
function SourceBadge({ source, tts = false }) {
  if (!source) return null;
  const isLive = tts
    ? source === 'gnani_timbre_tts'
    : source === 'gnani_prisma_stt';
  return (
    <span
      className={[
        'text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border',
        isLive
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          : 'bg-amber-500/10  border-amber-500/25  text-amber-400',
      ].join(' ')}
    >
      {isLive ? '● LIVE' : '◎ DEMO'}
    </span>
  );
}
