import { useState, useEffect } from "react";
import { Volume2, VolumeX, Flame, Sun, Moon } from "lucide-react";
import { playSound } from "./sound.js";
import { loadPersistedState, savePersistedState } from "./storage.js";
import { MODE_ACCENTS } from "./modeAccents.js";
import TresetaBoard from "./games/TresetaBoard.jsx";
import TresetaBoard3 from "./games/TresetaBoard3.jsx";
import BriskulaBoard from "./games/BriskulaBoard.jsx";

const CONTENT_RAIL_CLASS = "w-full max-w-md md:max-w-2xl mx-auto";

export default function App() {
  const persisted = loadPersistedState();

  const [activeMode, setActiveMode] = useState(persisted.activeMode);

  // Team Names — shared across both game modes.
  const [team1Name, setTeam1Name] = useState(persisted.team1Name);
  const [team2Name, setTeam2Name] = useState(persisted.team2Name);

  // Trešeta player-count toggle (2 = teams, 3 = individual play). Its
  // own persisted field, independent of activeMode, so it's remembered
  // across reloads without affecting Briškula.
  const [tresetaPlayerCount, setTresetaPlayerCount] = useState(persisted.tresetaPlayerCount);

  // Per-mode score state — each mode keeps its own progress when you
  // switch away and back, since only the active board is mounted.
  // treseta3 is a fully independent match from treseta (2-player), so
  // toggling player count never touches either match's history.
  const [tresetaState, setTresetaState] = useState(persisted.treseta);
  const [treseta3State, setTreseta3State] = useState(persisted.treseta3);
  const [briskulaState, setBriskulaState] = useState(persisted.briskula);

  const updateTresetaState = (partial) =>
    setTresetaState((prev) => ({ ...prev, ...partial }));
  const updateTreseta3State = (partial) =>
    setTreseta3State((prev) => ({ ...prev, ...partial }));
  const updateBriskulaState = (partial) =>
    setBriskulaState((prev) => ({ ...prev, ...partial }));

  // Whether the currently-selected Trešeta variant already has hands
  // recorded — used to shrink the player-count toggle out of the way
  // once a match is underway, so score cards get more room.
  const tresetaMatchStarted =
    (tresetaPlayerCount === 3 ? treseta3State.rounds : tresetaState.rounds).length > 0;

  // UI & Audio State — shared across both modes.
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Light/dark felt theme. Session preference like the toggles below —
  // always opens in dark felt, not persisted across reloads.
  const [theme, setTheme] = useState("dark");

  // Banter: lighthearted taunts for whoever's losing. Off = no jabs, no
  // roast (mirrors soundEnabled: a session preference, not persisted).
  const [banterEnabled, setBanterEnabled] = useState(true);

  useEffect(() => {
    // Debounced so typing a team name doesn't re-serialize the whole
    // match state (including every mode/variant's full rounds history)
    // on every keystroke.
    const timeoutId = setTimeout(() => {
      savePersistedState({
        activeMode,
        team1Name,
        team2Name,
        tresetaPlayerCount,
        treseta: tresetaState,
        treseta3: treseta3State,
        briskula: briskulaState,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    activeMode,
    team1Name,
    team2Name,
    tresetaPlayerCount,
    tresetaState,
    treseta3State,
    briskulaState,
  ]);

  return (
    <div
      data-theme={theme === "light" ? "light" : undefined}
      className="min-h-screen bg-felt text-amber-50 flex flex-col font-serif select-none pb-12 relative overflow-hidden"
    >
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
      <header className={`${CONTENT_RAIL_CLASS} sticky top-0 z-30 bg-felt-panel/90 backdrop-blur-md border-b border-amber-600/30 px-4 py-3 flex flex-wrap items-center gap-y-2 shadow-lg`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-900/50">
            <div className="w-full h-full bg-felt rounded-[10px] flex items-center justify-center">
              <span className="text-lg">🎴</span>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-xl text-felt-ink tracking-wide font-serif leading-none flex items-center gap-1.5">
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
                ? "bg-amber-500/20 border-amber-500/60 text-felt-ink"
                : "bg-felt-panel border-felt-panel-border text-felt-ink-muted"
            }`}
            title="Zvuk"
            aria-label={soundEnabled ? "Isključi zvuk" : "Uključi zvuk"}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <Volume2 size={16} className="fill-amber-400 text-amber-400" />
            ) : (
              <VolumeX size={16} />
            )}
          </button>

          <button
            onClick={() => {
              setBanterEnabled(!banterEnabled);
              if (soundEnabled) playSound("tap");
            }}
            className={`min-w-11 min-h-11 rounded-full flex items-center justify-center border transition active:scale-95 ${
              banterEnabled
                ? "bg-amber-500/20 border-amber-500/60 text-felt-ink"
                : "bg-felt-panel border-felt-panel-border text-felt-ink-muted"
            }`}
            title="Zafrkancija (peckanje gubitnika)"
            aria-label={banterEnabled ? "Isključi zafrkanciju" : "Uključi zafrkanciju"}
            aria-pressed={banterEnabled}
          >
            <Flame size={16} className={banterEnabled ? "fill-amber-400" : ""} />
          </button>

          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              if (soundEnabled) playSound("tap");
            }}
            className={`min-w-11 min-h-11 rounded-full flex items-center justify-center border transition active:scale-95 ${
              theme === "light"
                ? "bg-amber-500/20 border-amber-500/60 text-felt-ink"
                : "bg-felt-panel border-felt-panel-border text-felt-ink-muted"
            }`}
            title="Svijetli / tamni stol"
            aria-label={theme === "dark" ? "Prebaci na svijetli način" : "Prebaci na tamni način"}
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} className="fill-amber-400 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`${CONTENT_RAIL_CLASS} flex-1 px-4 py-4 flex flex-col space-y-4 z-10 font-sans`}>
        {/* Game Mode Switcher */}
        <div className="bg-felt-panel/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-felt-ink-muted shadow-inner">
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
              className={`flex-1 min-h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeMode === key
                  ? `${MODE_ACCENTS[key].activeTab} font-bold shadow-md`
                  : "hover:text-felt-ink"
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>

        {activeMode === "treseta" && (
          <div
            className={`bg-felt-panel/80 border border-amber-500/30 rounded-2xl flex font-semibold text-felt-ink-muted shadow-inner transition-all duration-200 ${
              tresetaMatchStarted ? "p-0.5 text-[10px]" : "p-1 text-xs"
            }`}
          >
            {[
              { key: 2, label: "👥 Ekipe" },
              { key: 3, label: "👥 3 igrača" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setTresetaPlayerCount(key);
                  if (soundEnabled) playSound("tap");
                }}
                className={`flex-1 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tresetaMatchStarted ? "min-h-7" : "min-h-11"
                } ${
                  tresetaPlayerCount === key
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md"
                    : "hover:text-felt-ink"
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {activeMode === "treseta" ? (
          tresetaPlayerCount === 3 ? (
            <TresetaBoard3
              soundEnabled={soundEnabled}
              banterEnabled={banterEnabled}
              state={treseta3State}
              onUpdate={updateTreseta3State}
            />
          ) : (
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
          )
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
