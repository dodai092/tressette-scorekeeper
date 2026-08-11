import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  History,
  RefreshCw,
  Zap,
  Trash2,
  ListOrdered,
  AlertTriangle,
  Pencil,
  Flame,
} from "lucide-react";

// Helper for Web Audio sound effects
let sharedAudioCtx = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
};

const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "tap") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "score") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio fallback
  }
};

// Returns the winning team's name once one side has reached targetScore
// with a strictly higher total than the other, otherwise null.
const computeWinner = (updated1, updated2, targetScore, team1Name, team2Name) => {
  if (updated1 < targetScore && updated2 < targetScore) return null;
  if (updated1 === updated2) return null;
  return updated1 > updated2 ? team1Name : team2Name;
};

const BANTER_GAP_THRESHOLD = 15;

// Mid-game jabs, shown while a team is down by BANTER_GAP_THRESHOLD+ points
// but nobody has won yet. Each takes the losing team's name and the gap.
// Written in a Michael Scott (The Office) register — earnest, awkward,
// backhanded, oversharing — as original lines, not show quotes.
const LOSING_JABS = [
  (loser) => `${loser}, I'm not saying you're losing. I'm saying if this were a performance review, we'd need to talk.`,
  (loser, gap) => `Down by ${gap}. Do I have a speech for this moment? I do not. I did not prepare for this outcome.`,
  (loser) => `${loser}, I believe in you. I don't have evidence for that belief. But I believe it.`,
  (loser, gap) => `${gap} points behind is a choice, ${loser}. A weird choice. But a choice.`,
  (loser) => `${loser}, on a scale of "fine" to "concerning," this is landing somewhere past concerning.`,
  (loser, gap) => `${loser} is down ${gap}. I'd offer advice, but I only know how to make things worse. Historically.`,
  (loser) => `${loser}, congratulations on discovering a brand new way to lose. Innovation. Very impressive. Very sad.`,
  (loser, gap) => `${gap}-point gap. ${loser}, I'm getting you a participation trophy. It's already engraved. I did it early. I was confident.`,
  (loser) => `${loser}, deep down, I believe there's a winner in you. He's just really, really far down.`,
  (loser, gap) => `Down ${gap}? ${loser}, that's rough. That's — yeah. That's a whole thing.`,
];

// End-game roast, shown in the winner modal once a game is over. Each
// takes the losing team's name and the final point gap. Same voice as
// the jabs above — original lines, not show quotes.
const ROAST_LINES = [
  (loser) => `${loser}, I'm not upset. I'm just going to remember this forever and bring it up at inappropriate times.`,
  (loser, gap) => `Lost by ${gap}. ${loser}, I'm writing this down in a file. The file is called "Things I'll Mention Later."`,
  (loser) => `${loser}, everybody loses sometimes. You lose a lot of the time. There's a difference, and you're on the wrong side of it.`,
  (loser) => `${loser}, if there were an award for tonight, you would not win it. I checked. Twice.`,
  (loser, gap) => `${gap} points. I'm not mad, ${loser}. I'm just going to need a minute. Several minutes.`,
  (loser) => `${loser}, I want you to know I respect you as a person. As a card player, we're going to need to have a longer conversation.`,
  (loser) => `I need to say something, and I need you to not take this personally, ${loser}: that was rough to watch.`,
  (loser) => `${loser}, I hereby award you the trophy for Most Enthusiastic Loser. It's a real trophy now. I willed it into existence.`,
  (loser, gap) => `${gap}-point loss, ${loser}. Somewhere, a tiny invisible trophy engraved "Second Place Is Still Trying" has your name on it.`,
  (loser) => `${loser}, I'm proud of you. Not for the game — that was a disaster — just, you know. In general. As a human.`,
];

const pickRandom = (pool, ...args) => {
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line(...args);
};

// rounds is newest-first (index 0 = most recent). Recomputes running
// totals bottom-up and returns them in the same newest-first order.
const recalcTotals = (rounds) => {
  let run1 = 0;
  let run2 = 0;
  const recalculated = new Array(rounds.length);
  for (let i = rounds.length - 1; i >= 0; i--) {
    run1 += rounds[i].pts1;
    run2 += rounds[i].pts2;
    recalculated[i] = { ...rounds[i], total1: run1, total2: run2 };
  }
  return { rounds: recalculated, total1: run1, total2: run2 };
};

const clamp11 = (n) => Math.min(11, Math.max(0, n));

const TEAM_ACCENTS = {
  blue: {
    label: "text-blue-800",
    text: "text-blue-900",
    border: "border-blue-200 focus:border-blue-600",
    gamesWon: "text-blue-900",
    quickBtn: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300/60",
  },
  red: {
    label: "text-red-800",
    text: "text-red-900",
    border: "border-red-200 focus:border-red-600",
    gamesWon: "text-red-900",
    quickBtn: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300/60",
  },
};

function TeamCard({
  icon,
  label,
  name,
  onNameChange,
  namePlaceholder,
  score,
  targetScore,
  gamesWon,
  accentColor,
  onQuickAdd,
  quickAmounts,
}) {
  const accent = TEAM_ACCENTS[accentColor];

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl relative flex flex-col justify-between text-slate-900">
      <div className="space-y-3">
        <div>
          <label
            className={`text-[9px] uppercase font-bold ${accent.label} tracking-wider flex items-center gap-1 mb-0.5 font-mono`}
          >
            <span>{icon}</span> {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`bg-transparent font-black text-base ${accent.text} tracking-tight w-full outline-none border-b border-dashed ${accent.border} py-0.5 pr-5 font-serif`}
              placeholder={namePlaceholder}
              aria-label={`${label} name`}
            />
            <Pencil
              size={11}
              className="absolute right-0 top-1.5 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="text-center py-1">
          <span
            key={score}
            className="motion-score-pop text-5xl font-black tracking-tight text-slate-950 font-serif drop-shadow-sm inline-block"
            style={{ animation: "score-pop 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {score}
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800/70 font-mono mt-0.5">
            / {targetScore} Points
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">
            Games Won: <strong className={accent.gamesWon}>{gamesWon}</strong>
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/80 space-y-1 mt-2">
        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
          Quick Add:
        </span>
        <div className="flex items-center gap-1.5 justify-between">
          {quickAmounts.map((pts) => (
            <button
              key={pts}
              onClick={() => onQuickAdd(pts)}
              className={`flex-1 min-h-11 ${accent.quickBtn} font-bold text-xs rounded-xl active:scale-95 transition shadow-sm`}
            >
              +{pts}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "tressette-scorekeeper-state-v1";

const loadPersistedState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const savePersistedState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable (e.g. private mode) — fail silently.
  }
};

export default function App() {
  const persisted = loadPersistedState();

  // Game Target Score Options (Only 41, 51)
  const [targetScore, setTargetScore] = useState(persisted?.targetScore ?? 41);

  // Team Names State
  const [team1Name, setTeam1Name] = useState(persisted?.team1Name ?? "Us");
  const [team2Name, setTeam2Name] = useState(persisted?.team2Name ?? "Them");

  // Score & Round Tracking State
  const [scoreTeam1, setScoreTeam1] = useState(persisted?.scoreTeam1 ?? 0);
  const [scoreTeam2, setScoreTeam2] = useState(persisted?.scoreTeam2 ?? 0);
  const [gamesWon1, setGamesWon1] = useState(persisted?.gamesWon1 ?? 0);
  const [gamesWon2, setGamesWon2] = useState(persisted?.gamesWon2 ?? 0);
  const [rounds, setRounds] = useState(persisted?.rounds ?? []);

  // Single input point entry for Team 1 (0 to 11)
  const [customPts1, setCustomPts1] = useState("");

  // UI & Audio State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [tieNotice, setTieNotice] = useState(false);

  // Banter: lighthearted taunts for whoever's losing. Mid-game jab while
  // play continues, a roast line once the game ends. Off = no jabs, no
  // roast (mirrors soundEnabled: a session preference, not persisted).
  const [banterEnabled, setBanterEnabled] = useState(true);
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);

  // Modal Confirmation Dialog State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    // match state (including the full rounds history) on every keystroke.
    const timeoutId = setTimeout(() => {
      savePersistedState({
        targetScore,
        team1Name,
        team2Name,
        scoreTeam1,
        scoreTeam2,
        gamesWon1,
        gamesWon2,
        rounds,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [targetScore, team1Name, team2Name, scoreTeam1, scoreTeam2, gamesWon1, gamesWon2, rounds]);

  // Check win condition whenever scores change
  const checkWinCondition = (updated1, updated2) => {
    const winner = computeWinner(updated1, updated2, targetScore, team1Name, team2Name);
    const gap = Math.abs(updated1 - updated2);

    if (winner === null) {
      const bothOverTarget = updated1 >= targetScore && updated2 >= targetScore;
      const isTie = bothOverTarget && updated1 === updated2;
      setTieNotice(isTie);
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD) {
        const loserName = updated1 < updated2 ? team1Name : team2Name;
        setBanterJab(pickRandom(LOSING_JABS, loserName, gap));
      } else {
        setBanterJab(null);
      }
      return;
    }

    setTieNotice(false);
    setBanterJab(null);
    if (banterEnabled) {
      const loserName = winner === team1Name ? team2Name : team1Name;
      setRoastLine(pickRandom(ROAST_LINES, loserName, gap));
    } else {
      setRoastLine(null);
    }
    if (winner === team1Name) setGamesWon1((g) => g + 1);
    else setGamesWon2((g) => g + 1);
    setWinnerTeam(winner);
    setShowWinnerModal(true);
    if (soundEnabled) playSound("win");
  };

  // Add round score entry
  const addRoundScore = (pts1, pts2, details = "Hand points") => {
    const newPts1 = Math.max(0, parseInt(pts1) || 0);
    const newPts2 = Math.max(0, parseInt(pts2) || 0);

    if (newPts1 === 0 && newPts2 === 0) return;

    const updated1 = scoreTeam1 + newPts1;
    const updated2 = scoreTeam2 + newPts2;

    const roundEntry = {
      id: Date.now(),
      pts1: newPts1,
      pts2: newPts2,
      total1: updated1,
      total2: updated2,
      details,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setRounds([roundEntry, ...rounds]);
    setScoreTeam1(updated1);
    setScoreTeam2(updated2);

    if (soundEnabled) playSound("score");

    checkWinCondition(updated1, updated2);
  };

  // Fast manual points add
  const addQuickPoints = (team, amount) => {
    if (soundEnabled) playSound("tap");
    const pts1 = team === 1 ? amount : 0;
    const pts2 = team === 1 ? 0 : amount;
    addRoundScore(pts1, pts2, `+${amount} pt`);
  };

  // Single Input Handler for Team 1 score (Capped 0 - 11)
  const handlePts1Change = (val) => {
    if (val === "") {
      setCustomPts1("");
      return;
    }
    const p1 = clamp11(parseInt(val) || 0);
    setCustomPts1(p1.toString());
  };

  // Handle direct custom score submit (Team 2 automatically gets 11 - Team 1)
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customPts1 === "") return;

    const p1 = clamp11(parseInt(customPts1) || 0);
    const p2 = 11 - p1;

    addRoundScore(p1, p2, `Hand (${p1} to ${p2})`);
    setCustomPts1("");
  };

  const removeRoundById = (id) => {
    if (showWinnerModal) return; // don't mutate history while a win is pending confirmation
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2 } = recalcTotals(filtered);
    setRounds(recalculated);
    setScoreTeam1(total1);
    setScoreTeam2(total2);
    checkWinCondition(total1, total2);
  };

  const undoLastRound = () => {
    if (rounds.length === 0) return;
    removeRoundById(rounds[0].id);
  };

  // Resets the current game's scores/history. Games Won is never touched
  // here (matches original behavior) — it accumulates across games until
  // the app's storage is cleared. fullReset (the "New Game" button) also
  // closes the confirm dialog and clears the tie notice; dismissing the
  // winner modal (fullReset false) doesn't need to since those are
  // already closed/false at that point.
  const resetGame = (fullReset) => {
    if (soundEnabled) playSound("tap");
    setScoreTeam1(0);
    setScoreTeam2(0);
    setRounds([]);
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
    if (fullReset) {
      setShowConfirmModal(false);
      setTieNotice(false);
    }
  };

  const currentT1Pts = customPts1 !== "" ? clamp11(parseInt(customPts1) || 0) : 0;
  const currentT2Pts = customPts1 !== "" ? 11 - currentT1Pts : 11;

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
              Tressette{" "}
              <span className="text-xs font-sans text-amber-400/80 font-normal">
                Scorekeeper
              </span>
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
        {/* Target Score Segmented Control (Goal 41 pt / 51 pt) */}
        <div className="bg-emerald-900/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-emerald-200 shadow-inner">
          {[41, 51].map((pts) => (
            <button
              key={pts}
              onClick={() => {
                setTargetScore(pts);
                if (soundEnabled) playSound("tap");
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                targetScore === pts
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md"
                  : "hover:text-amber-200"
              }`}
            >
              <span>🏆 Goal {pts} pt</span>
            </button>
          ))}
        </div>

        {tieNotice && (
          <div
            className="motion-slide-fade-in bg-amber-500/20 border border-amber-500/60 text-amber-200 text-xs font-semibold rounded-xl px-3 py-2 text-center"
            style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            Tied at {scoreTeam1} — keep playing until someone's ahead.
          </div>
        )}

        {banterJab && (
          <div
            className="motion-slide-fade-in bg-orange-500/15 border border-orange-500/40 text-orange-200 text-xs font-semibold rounded-xl px-3 py-2 text-center italic"
            style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            🔥 {banterJab}
          </div>
        )}

        {/* TEAM 1 & TEAM 2 PARCHMENT CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <TeamCard
            icon="⚔️"
            label="Team A"
            name={team1Name}
            onNameChange={setTeam1Name}
            namePlaceholder="Us"
            score={scoreTeam1}
            targetScore={targetScore}
            gamesWon={gamesWon1}
            accentColor="blue"
            onQuickAdd={(pts) => addQuickPoints(1, pts)}
            quickAmounts={[3, 4]}
          />
          <TeamCard
            icon="🍷"
            label="Team B"
            name={team2Name}
            onNameChange={setTeam2Name}
            namePlaceholder="Them"
            score={scoreTeam2}
            targetScore={targetScore}
            gamesWon={gamesWon2}
            accentColor="red"
            onQuickAdd={(pts) => addQuickPoints(2, pts)}
            quickAmounts={[3, 4]}
          />
        </div>

        {/* CUSTOM HAND SCORE ENTRY BOX (11-Point Total Bound) */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-2xl p-3 border-2 border-amber-300/80 shadow-md space-y-2 text-slate-900">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 px-1">
            <span className="flex items-center gap-1">
              🎴 Record Hand Score
            </span>
            <span className="text-emerald-800 font-mono">Total = 11 pt</span>
          </div>

          <form
            onSubmit={handleCustomSubmit}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="11"
                value={customPts1}
                onChange={(e) => handlePts1Change(e.target.value)}
                placeholder={`${team1Name} pts (0-11)`}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-amber-600 shadow-inner"
              />
            </div>

            {/* Calculated Auto-Fill Badge for Team 2 */}
            <div className="px-3 py-2 bg-amber-200/70 border border-amber-300 rounded-xl text-xs font-black text-red-900 min-w-[100px] text-center shrink-0">
              {team2Name}: {customPts1 !== "" ? currentT2Pts : 11}
            </div>

            <button
              type="submit"
              className="min-h-11 px-4 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold text-xs rounded-xl active:scale-95 transition shrink-0 border border-amber-500/40 shadow-sm"
            >
              Add
            </button>
          </form>
        </div>

        {/* SCORE HISTORY SECTION */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-3 text-slate-900">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif">
              <History size={14} className="text-amber-700" />
              Game Hand History ({rounds.length})
            </span>
            {rounds.length > 0 && (
              <button
                onClick={undoLastRound}
                className="text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
              >
                <RotateCcw size={12} /> Undo Last
              </button>
            )}
          </div>

          {rounds.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <ListOrdered size={24} className="mx-auto text-amber-800/40" />
              <p className="text-xs italic font-serif">
                No hands recorded yet.
              </p>
              <p className="text-[11px] text-slate-500">
                Use quick buttons or enter scores above.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 border-b border-amber-200/60 pb-1 px-2 font-mono">
                <span className="col-span-2">Hand</span>
                <span className="col-span-3 text-blue-900 truncate">
                  {team1Name}
                </span>
                <span className="col-span-3 text-red-900 truncate">
                  {team2Name}
                </span>
                <span className="col-span-2 text-right">Total</span>
                <span className="col-span-2"></span>
              </div>

              {/* Round Entry Rows */}
              {rounds.map((r, index) => (
                <div
                  key={r.id}
                  className="motion-slide-fade-in grid grid-cols-12 items-center bg-white/80 p-2.5 rounded-xl text-xs border border-amber-200/80 shadow-sm"
                  style={{ animation: "slide-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <div className="col-span-2 text-slate-600 font-mono text-[11px] font-semibold">
                    #{rounds.length - index}
                  </div>

                  <div className="col-span-3 font-bold text-blue-900">
                    +{r.pts1}
                  </div>

                  <div className="col-span-3 font-bold text-red-900">
                    +{r.pts2}
                  </div>

                  <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-[11px]">
                    {r.total1} - {r.total2}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => removeRoundById(r.id)}
                      className="min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-red-600 transition"
                      title="Delete hand"
                      aria-label={`Delete hand ${rounds.length - index}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Action */}
        <div className="pt-1">
          <button
            onClick={() => {
              if (soundEnabled) playSound("tap");
              setShowConfirmModal(true);
            }}
            className="w-full min-h-11 bg-transparent hover:bg-emerald-900/50 text-amber-200/70 hover:text-amber-200 border border-amber-500/25 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition uppercase tracking-wider"
          >
            <RefreshCw size={14} /> New Game
          </button>
        </div>
      </main>

      {/* Confirmation Modal for Resets */}
      {showConfirmModal && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className="motion-modal-in bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl text-slate-900"
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-300">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 font-serif">
                Start New Game?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                This will reset scores and hand history for the current game.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-amber-200/80 hover:bg-amber-200 text-slate-800 font-bold rounded-xl text-xs active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => resetGame(true)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/20 active:scale-95 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal Dialog */}
      {showWinnerModal && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className="motion-modal-in bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-400 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl text-slate-900"
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Trophy size={32} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 font-serif tracking-wide">
                VICTORY! 🎉
              </h2>
              <p className="text-base font-bold text-amber-900 mt-1">
                {winnerTeam} wins!
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Final score:{" "}
                <strong className="text-slate-900">{scoreTeam1}</strong> to{" "}
                <strong className="text-slate-900">{scoreTeam2}</strong> (Goal{" "}
                {targetScore} pt)
              </p>
              {roastLine && (
                <p className="text-xs italic text-orange-800/80 mt-2 border-t border-amber-300/60 pt-2">
                  🔥 {roastLine}
                </p>
              )}
            </div>

            <button
              onClick={() => resetGame(false)}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md border border-amber-500/40"
            >
              Start New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
