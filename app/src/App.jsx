import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Zap, Flame } from "lucide-react";
import { playSound } from "./sound.js";
import { loadPersistedState, savePersistedState } from "./storage.js";
import { MODE_ACCENTS } from "./modeAccents.js";
import TresetaBoard from "./games/TresetaBoard.jsx";
import BriskulaBoard from "./games/BriskulaBoard.jsx";

export default function App() {
  const persisted = loadPersistedState();

  const [activeMode, setActiveMode] = useState(persisted.activeMode);

  // Team Names — shared across both game modes.
  const [team1Name, setTeam1Name] = useState(persisted.team1Name);
  const [team2Name, setTeam2Name] = useState(persisted.team2Name);

  // Per-mode score state — each mode keeps its own progress when you
  // switch away and back, since only the active board is mounted.
  const [tresetaState, setTresetaState] = useState(persisted.treseta);
  const [briskulaState, setBriskulaState] = useState(persisted.briskula);

  const updateTresetaState = (partial) =>
    setTresetaState((prev) => ({ ...prev, ...partial }));
  const updateBriskulaState = (partial) =>
    setBriskulaState((prev) => ({ ...prev, ...partial }));

  // UI & Audio State — shared across both modes.
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Banter: lighthearted taunts for whoever's losing. Off = no jabs, no
  // roast (mirrors soundEnabled: a session preference, not persisted).
  const [banterEnabled, setBanterEnabled] = useState(true);

  // Mobile Wake Lock toggle. The Wake Lock API only exists in secure
  // contexts (https:// or localhost) — over plain http:// on a local
  // network (e.g. testing on a phone via LAN IP) it's simply absent, so
  // the button is disabled with an explanation instead of silently no-oping.
  const [screenLocked, setScreenLocked] = useState(false);
  const wakeLockRef = useRef(null);
  const wakeLockSupported =
    typeof navigator !== "undefined" && "wakeLock" in navigator;

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setScreenLocked(true);
      }
    } catch (err) {
      console.log("Wake Lock failed:", err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setScreenLocked(false);
    }
  };

  useEffect(() => {
    requestWakeLock();
    return () => releaseWakeLock();
  }, []);

  useEffect(() => {
    // Debounced so typing a team name doesn't re-serialize the whole
    // match state (including both modes' full rounds history) on every
    // keystroke.
    const timeoutId = setTimeout(() => {
      savePersistedState({
        activeMode,
        team1Name,
        team2Name,
        treseta: tresetaState,
        briskula: briskulaState,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeMode, team1Name, team2Name, tresetaState, briskulaState]);

  return (
    <div className="min-h-screen bg-emerald-950 text-amber-50 flex flex-col font-serif select-none pb-12 relative overflow-hidden">
      <style>{`
        @keyframes score-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slide-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-score-pop,
          .motion-fade-in,
          .motion-modal-in,
          .motion-slide-fade-in {
            animation: none !important;
          }
        }
      `}</style>

      {/* Tavern Felt Texture Overlay Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

      {/* Card Table Header */}
      <header className="sticky top-0 z-30 bg-emerald-900/90 backdrop-blur-md border-b border-amber-600/30 px-4 py-3 flex flex-wrap items-center gap-y-2 shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-900/50">
            <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
              <span className="text-lg">🎴</span>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base text-amber-200 tracking-wide font-serif leading-none flex items-center gap-1.5">
              Tressette
            </h1>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="ml-auto flex items-center flex-wrap justify-end gap-2 font-sans">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playSound("tap");
            }}
            className={`min-w-11 min-h-11 rounded-full flex items-center justify-center border transition active:scale-95 ${
              soundEnabled
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                : "bg-emerald-900 border-emerald-700/60 text-emerald-300"
            }`}
            title="Sound"
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <Volume2 size={16} className="fill-amber-400 text-amber-400" />
            ) : (
              <VolumeX size={16} />
            )}
          </button>

          <button
            onClick={screenLocked ? releaseWakeLock : requestWakeLock}
            disabled={!wakeLockSupported}
            className={`min-w-11 min-h-11 rounded-full flex items-center justify-center border transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
              screenLocked
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                : "bg-emerald-900 border-emerald-700/60 text-emerald-300"
            }`}
            title={
              wakeLockSupported
                ? undefined
                : "Requires a secure (https) connection — will work once deployed"
            }
            aria-label={
              wakeLockSupported
                ? screenLocked
                  ? "Turn off keep-screen-awake"
                  : "Keep screen awake"
                : "Keep screen awake (unavailable on this connection)"
            }
            aria-pressed={screenLocked}
          >
            <Zap
              size={16}
              className={screenLocked ? "fill-amber-400 text-amber-400" : ""}
            />
          </button>

          <button
            onClick={() => {
              setBanterEnabled(!banterEnabled);
              if (soundEnabled) playSound("tap");
            }}
            className={`min-w-11 min-h-11 rounded-full flex items-center justify-center border transition active:scale-95 ${
              banterEnabled
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                : "bg-emerald-900 border-emerald-700/60 text-emerald-500"
            }`}
            title="Banter (taunt the loser)"
            aria-label={banterEnabled ? "Turn off banter" : "Turn on banter"}
            aria-pressed={banterEnabled}
          >
            <Flame size={16} className={banterEnabled ? "fill-amber-400" : ""} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 flex flex-col space-y-4 z-10 font-sans">
        {/* Game Mode Switcher */}
        <div className="bg-emerald-900/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-emerald-200 shadow-inner">
          {[
            { key: "treseta", label: "🃏 Trešeta" },
            { key: "briskula", label: "🎴 Briškula" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveMode(key);
                if (soundEnabled) playSound("tap");
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeMode === key
                  ? `${MODE_ACCENTS[key].activeTab} font-bold shadow-md`
                  : "hover:text-amber-200"
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>

        {activeMode === "treseta" ? (
          <TresetaBoard
            soundEnabled={soundEnabled}
            banterEnabled={banterEnabled}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1NameChange={setTeam1Name}
            onTeam2NameChange={setTeam2Name}
            state={tresetaState}
            onUpdate={updateTresetaState}
          />
        ) : (
          <BriskulaBoard
            soundEnabled={soundEnabled}
            banterEnabled={banterEnabled}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1NameChange={setTeam1Name}
            onTeam2NameChange={setTeam2Name}
            state={briskulaState}
            onUpdate={updateBriskulaState}
          />
        )}
      </main>
    </div>
  );
}
