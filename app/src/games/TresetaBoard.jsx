import { useState } from "react";
import {
  Trophy,
  RotateCcw,
  History,
  RefreshCw,
  ListOrdered,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { playSound } from "../sound.js";
import { LOSING_JABS, ROAST_LINES, pickRandom } from "../banter.js";
import TeamCard from "../components/TeamCard.jsx";
import {
  TARGET_SCORE_OPTIONS,
  HAND_CAP,
  BANTER_GAP_THRESHOLD,
  computeWinner,
  recalcTotals,
  clamp11,
} from "./treseta.js";

export default function TresetaBoard({
  soundEnabled,
  banterEnabled,
  team1Name,
  team2Name,
  onTeam1NameChange,
  onTeam2NameChange,
  state,
  onUpdate,
}) {
  const { targetScore, scoreTeam1, scoreTeam2, gamesWon1, gamesWon2, rounds } = state;

  // Single input point entry for Team 1 (0 to HAND_CAP)
  const [customPts1, setCustomPts1] = useState("");

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [tieNotice, setTieNotice] = useState(false);

  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Check win condition whenever scores change
  const checkWinCondition = (updated1, updated2) => {
    const winner = computeWinner(updated1, updated2, targetScore, team1Name, team2Name);
    const gap = Math.abs(updated1 - updated2);
    const gapThreshold = BANTER_GAP_THRESHOLD(targetScore);

    if (winner === null) {
      const bothOverTarget = updated1 >= targetScore && updated2 >= targetScore;
      const isTie = bothOverTarget && updated1 === updated2;
      setTieNotice(isTie);
      if (banterEnabled && !isTie && gap >= gapThreshold) {
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
    onUpdate(
      winner === team1Name
        ? { gamesWon1: gamesWon1 + 1 }
        : { gamesWon2: gamesWon2 + 1 }
    );
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

    onUpdate({
      rounds: [roundEntry, ...rounds],
      scoreTeam1: updated1,
      scoreTeam2: updated2,
    });

    if (soundEnabled) playSound("score");

    checkWinCondition(updated1, updated2);
  };

  // Fast manual points add (Akuže declarations)
  const addQuickPoints = (team, amount) => {
    if (soundEnabled) playSound("tap");
    const pts1 = team === 1 ? amount : 0;
    const pts2 = team === 1 ? 0 : amount;
    addRoundScore(pts1, pts2, `+${amount} pt`);
  };

  // Single Input Handler for Team 1 score (Capped 0 - HAND_CAP)
  const handlePts1Change = (val) => {
    if (val === "") {
      setCustomPts1("");
      return;
    }
    const p1 = clamp11(parseInt(val) || 0);
    setCustomPts1(p1.toString());
  };

  // Handle direct custom score submit (Team 2 automatically gets HAND_CAP - Team 1)
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customPts1 === "") return;

    const p1 = clamp11(parseInt(customPts1) || 0);
    const p2 = HAND_CAP - p1;

    addRoundScore(p1, p2, `Hand (${p1} to ${p2})`);
    setCustomPts1("");
  };

  const removeRoundById = (id) => {
    if (showWinnerModal) return; // don't mutate history while a win is pending confirmation
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2 } = recalcTotals(filtered);
    onUpdate({ rounds: recalculated, scoreTeam1: total1, scoreTeam2: total2 });
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
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
    if (fullReset) {
      setShowConfirmModal(false);
      setTieNotice(false);
    }
  };

  const currentT1Pts = customPts1 !== "" ? clamp11(parseInt(customPts1) || 0) : 0;
  const currentT2Pts = customPts1 !== "" ? HAND_CAP - currentT1Pts : HAND_CAP;

  return (
    <>
      {/* Target Score Segmented Control */}
      <div className="bg-emerald-900/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-emerald-200 shadow-inner">
        {TARGET_SCORE_OPTIONS.map((pts) => (
          <button
            key={pts}
            onClick={() => {
              onUpdate({ targetScore: pts });
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
          onNameChange={onTeam1NameChange}
          namePlaceholder="Us"
          score={scoreTeam1}
          scoreSuffix={`/ ${targetScore} Points`}
          wonLabel="Games Won"
          wonCount={gamesWon1}
          accentColor="blue"
          onQuickAdd={(pts) => addQuickPoints(1, pts)}
          quickAmounts={[
            { value: 3, bottom: "+3" },
            { value: 4, bottom: "+4" },
          ]}
          quickAddHeading="Akuže:"
        />
        <TeamCard
          icon="🍷"
          label="Team B"
          name={team2Name}
          onNameChange={onTeam2NameChange}
          namePlaceholder="Them"
          score={scoreTeam2}
          scoreSuffix={`/ ${targetScore} Points`}
          wonLabel="Games Won"
          wonCount={gamesWon2}
          accentColor="red"
          onQuickAdd={(pts) => addQuickPoints(2, pts)}
          quickAmounts={[
            { value: 3, bottom: "+3" },
            { value: 4, bottom: "+4" },
          ]}
          quickAddHeading="Akuže:"
        />
      </div>

      {/* CUSTOM HAND SCORE ENTRY BOX (HAND_CAP-Point Total Bound) */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-2xl p-3 border-2 border-amber-300/80 shadow-md space-y-2 text-slate-900">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 px-1">
          <span className="flex items-center gap-1">
            🎴 Record Hand Score
          </span>
          <span className="text-emerald-800 font-mono">Total = {HAND_CAP} pt</span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customPts1}
              onChange={(e) => handlePts1Change(e.target.value)}
              placeholder={`${team1Name} pts (0-${HAND_CAP})`}
              aria-label={`${team1Name} hand points, 0 to ${HAND_CAP}`}
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner"
            />
          </div>

          {/* Calculated Auto-Fill Badge for Team 2 */}
          <div className="px-3 py-2 bg-amber-200/70 border border-amber-300 rounded-xl text-xs font-black text-red-900 min-w-[100px] text-center shrink-0">
            {team2Name}: {customPts1 !== "" ? currentT2Pts : HAND_CAP}
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
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif">
            <History size={14} className="text-amber-700" />
            Game Hand History ({rounds.length})
          </h2>
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
            <p className="text-xs italic font-serif">No hands recorded yet.</p>
            <p className="text-[11px] text-slate-500">
              Use quick buttons or enter scores above.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 border-b border-amber-200/60 pb-1 px-2 font-mono">
              <span className="col-span-2">Hand</span>
              <span className="col-span-3 text-blue-900 truncate">{team1Name}</span>
              <span className="col-span-3 text-red-900 truncate">{team2Name}</span>
              <span className="col-span-2 text-right">Total</span>
              <span className="col-span-2"></span>
            </div>

            {rounds.map((r, index) => (
              <div
                key={r.id}
                className="motion-slide-fade-in grid grid-cols-12 items-center bg-white/80 p-2.5 rounded-xl text-xs border border-amber-200/80 shadow-sm"
                style={{ animation: "slide-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <div className="col-span-2 text-slate-600 font-mono text-[11px] font-semibold">
                  #{rounds.length - index}
                </div>
                <div className="col-span-3 font-bold text-blue-900">+{r.pts1}</div>
                <div className="col-span-3 font-bold text-red-900">+{r.pts2}</div>
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
              <h3 className="font-bold text-base text-slate-900 font-serif">Start New Game?</h3>
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
              <p className="text-base font-bold text-amber-900 mt-1">{winnerTeam} wins!</p>
              <p className="text-xs text-slate-600 mt-2">
                Final score: <strong className="text-slate-900">{scoreTeam1}</strong> to{" "}
                <strong className="text-slate-900">{scoreTeam2}</strong> (Goal {targetScore} pt)
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
    </>
  );
}
