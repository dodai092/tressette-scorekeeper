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
import { BANTER_LINES, pickRandom } from "../banter.js";
import TeamCard from "../components/TeamCard.jsx";
import BanterOverlay from "../components/BanterOverlay.jsx";
import { MODE_ACCENTS } from "../modeAccents.js";
import {
  TARGET_SCORE_OPTIONS,
  HAND_CAP,
  BANTER_GAP_THRESHOLD,
  clamp11,
} from "./treseta.js";
import { computeWinner3, recalcTotals3 } from "./treseta3.js";

const PLAYER_ACCENTS = ["blue", "red", "green"];
const PLAYER_ICONS = ["⚔️", "🍷", "🎯"];

export default function TresetaBoard3({ soundEnabled, banterEnabled, state, onUpdate }) {
  const { targetScore, playerNames, scores, gamesWon, rounds } = state;

  const accent = MODE_ACCENTS.treseta;

  // Two free inputs (Player 1, Player 2); Player 3's points are derived
  // as HAND_CAP - p1 - p2, mirroring the 2-player board's single-input
  // auto-fill pattern.
  const [customPts1, setCustomPts1] = useState("");
  const [customPts2, setCustomPts2] = useState("");

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [tieNotice, setTieNotice] = useState(false);

  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const checkWinCondition = (updatedScores) => {
    const winner = computeWinner3(updatedScores, targetScore);
    const max = Math.max(...updatedScores);
    const min = Math.min(...updatedScores);
    const gap = max - min;
    const gapThreshold = BANTER_GAP_THRESHOLD(targetScore);

    if (winner === null) {
      const leaders = updatedScores.filter((s) => s === max);
      const isTie = max >= targetScore && leaders.length > 1;
      setTieNotice(isTie);
      if (banterEnabled && !isTie && gap >= gapThreshold) {
        setBanterJab(pickRandom(BANTER_LINES));
      } else {
        setBanterJab(null);
      }
      return;
    }

    setTieNotice(false);
    setBanterJab(null);
    if (banterEnabled) {
      setRoastLine(pickRandom(BANTER_LINES));
    } else {
      setRoastLine(null);
    }
    const updatedGamesWon = gamesWon.map((count, i) => (i === winner ? count + 1 : count));
    onUpdate({ gamesWon: updatedGamesWon });
    setWinnerIndex(winner);
    setShowWinnerModal(true);
    if (soundEnabled) playSound("win");
  };

  const addRoundScore = (pts1, pts2, pts3, details = "Hand points") => {
    const newPts1 = Math.max(0, parseInt(pts1) || 0);
    const newPts2 = Math.max(0, parseInt(pts2) || 0);
    const newPts3 = Math.max(0, parseInt(pts3) || 0);

    if (newPts1 === 0 && newPts2 === 0 && newPts3 === 0) return;

    const updatedScores = [scores[0] + newPts1, scores[1] + newPts2, scores[2] + newPts3];

    const roundEntry = {
      id: Date.now(),
      pts1: newPts1,
      pts2: newPts2,
      pts3: newPts3,
      total1: updatedScores[0],
      total2: updatedScores[1],
      total3: updatedScores[2],
      details,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onUpdate({
      rounds: [roundEntry, ...rounds],
      scores: updatedScores,
    });

    if (soundEnabled) playSound("score");

    checkWinCondition(updatedScores);
  };

  // Fast manual points add (Akuže declarations) for a single player.
  const addQuickPoints = (playerIndex, amount) => {
    if (soundEnabled) playSound("tap");
    const pts = [0, 0, 0];
    pts[playerIndex] = amount;
    addRoundScore(pts[0], pts[1], pts[2], `+${amount} pt`);
  };

  const handlePts1Change = (val) => {
    if (val === "") {
      setCustomPts1("");
      return;
    }
    setCustomPts1(clamp11(parseInt(val) || 0).toString());
  };

  const handlePts2Change = (val) => {
    if (val === "") {
      setCustomPts2("");
      return;
    }
    setCustomPts2(clamp11(parseInt(val) || 0).toString());
  };

  const p1Raw = customPts1 === "" ? 0 : clamp11(parseInt(customPts1) || 0);
  const p2Raw = customPts2 === "" ? 0 : clamp11(parseInt(customPts2) || 0);
  const p3Preview = HAND_CAP - p1Raw - p2Raw;
  const isOverCap = p3Preview < 0;
  const bothFilled = customPts1 !== "" && customPts2 !== "";

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!bothFilled || isOverCap) return;

    addRoundScore(p1Raw, p2Raw, p3Preview, `Hand (${p1Raw}/${p2Raw}/${p3Preview})`);
    setCustomPts1("");
    setCustomPts2("");
  };

  const removeRoundById = (id) => {
    if (showWinnerModal) return; // don't mutate history while a win is pending confirmation
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2, total3 } = recalcTotals3(filtered);
    onUpdate({ rounds: recalculated, scores: [total1, total2, total3] });
    checkWinCondition([total1, total2, total3]);
  };

  const undoLastRound = () => {
    if (rounds.length === 0) return;
    removeRoundById(rounds[0].id);
  };

  const resetGame = (fullReset) => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scores: [0, 0, 0], rounds: [] });
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
    if (fullReset) {
      setShowConfirmModal(false);
      setTieNotice(false);
    }
  };

  const handlePlayerNameChange = (index, value) => {
    const updatedNames = playerNames.map((n, i) => (i === index ? value : n));
    onUpdate({ playerNames: updatedNames });
  };

  return (
    <>
      {/* Target Score Segmented Control */}
      <div className="bg-felt-panel/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-felt-ink-muted shadow-inner">
        {TARGET_SCORE_OPTIONS.map((pts) => (
          <button
            key={pts}
            onClick={() => {
              onUpdate({ targetScore: pts });
              if (soundEnabled) playSound("tap");
            }}
            className={`flex-1 min-h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              targetScore === pts
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md"
                : "hover:text-felt-ink"
            }`}
          >
            <span>🏆 Cilj {pts} b</span>
          </button>
        ))}
      </div>

      {tieNotice && (
        <div
          className="motion-slide-fade-in bg-amber-500/20 border border-amber-500/60 text-felt-ink text-xs font-semibold rounded-xl px-3 py-2 text-center"
          style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          Neriješeno na {Math.max(...scores)} — igrajte dalje dok netko ne povede.
        </div>
      )}

      {/* THREE PLAYER PARCHMENT CARDS */}
      <div className="relative grid grid-cols-3 gap-2">
        {playerNames.map((playerName, i) => (
          <TeamCard
            key={i}
            compact
            icon={PLAYER_ICONS[i]}
            label={`Igrač ${i + 1}`}
            name={playerName}
            onNameChange={(value) => handlePlayerNameChange(i, value)}
            namePlaceholder={`Igrač ${i + 1}`}
            score={scores[i]}
            scoreSuffix={`/ ${targetScore} b`}
            wonLabel="Pobjede"
            wonCount={gamesWon[i]}
            accentColor={PLAYER_ACCENTS[i]}
            onQuickAdd={(pts) => addQuickPoints(i, pts)}
            quickAmounts={[
              { value: 3, bottom: "+3" },
              { value: 4, bottom: "+4" },
            ]}
            quickAddHeading="Akuže:"
          />
        ))}
        {banterJab && (
          <BanterOverlay line={banterJab} onDismiss={() => setBanterJab(null)} accent={accent} />
        )}
      </div>

      {/* CUSTOM HAND SCORE ENTRY BOX (HAND_CAP-Point Total Bound, 3-way) */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-2xl p-3 border-2 border-amber-300/80 shadow-md space-y-2 text-slate-900">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 px-1">
          <span className="flex items-center gap-1">
            🎴 Unesi rezultat ruke
          </span>
          <span className="text-emerald-800 font-mono">Ukupno = {HAND_CAP} b</span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customPts1}
            onChange={(e) => handlePts1Change(e.target.value)}
            placeholder={`0-${HAND_CAP}`}
            aria-label={`${playerNames[0]} bodovi ruke, 0 do ${HAND_CAP}`}
            className="min-w-0 flex-1 bg-white border border-amber-300 rounded-xl px-2 py-2 text-base font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customPts2}
            onChange={(e) => handlePts2Change(e.target.value)}
            placeholder={`0-${HAND_CAP}`}
            aria-label={`${playerNames[1]} bodovi ruke, 0 do ${HAND_CAP}`}
            className="min-w-0 flex-1 bg-white border border-amber-300 rounded-xl px-2 py-2 text-base font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner"
          />

          {/* Calculated Auto-Fill Badge for Player 3 */}
          <div
            className={`px-2 py-2 border rounded-xl text-[11px] font-black min-w-[76px] text-center shrink-0 ${
              isOverCap
                ? "bg-red-100 border-red-300 text-red-800"
                : "bg-amber-200/70 border-amber-300 text-emerald-900"
            }`}
          >
            {playerNames[2]}: {isOverCap ? "—" : p3Preview}
          </div>

          <button
            type="submit"
            disabled={!bothFilled || isOverCap}
            className="min-h-11 px-3 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold text-xs rounded-xl active:scale-95 transition shrink-0 border border-amber-500/40 shadow-sm disabled:opacity-40 disabled:active:scale-100"
          >
            Dodaj
          </button>
        </form>
      </div>

      {/* SCORE HISTORY SECTION */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-3 text-slate-900">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif">
            <History size={14} className="text-amber-700" />
            Povijest ruku ({rounds.length})
          </h2>
          {rounds.length > 0 && (
            <button
              onClick={undoLastRound}
              className="min-h-11 px-2 text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Poništi zadnje
            </button>
          )}
        </div>

        {rounds.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-1">
            <ListOrdered size={24} className="mx-auto text-amber-800/40" />
            <p className="text-xs italic font-serif">Još nema zabilježenih ruku.</p>
            <p className="text-[11px] text-slate-500">
              Koristite brze gumbe ili unesite rezultat iznad.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 border-b border-amber-200/60 pb-1 px-2 font-mono">
              <span className="col-span-2">Ruka</span>
              <span className="col-span-2 text-blue-900 truncate">{playerNames[0]}</span>
              <span className="col-span-2 text-red-900 truncate">{playerNames[1]}</span>
              <span className="col-span-2 text-emerald-900 truncate">{playerNames[2]}</span>
              <span className="col-span-2 text-right">Ukupno</span>
              <span className="col-span-2"></span>
            </div>

            {rounds.map((r, index) => (
              <div
                key={r.id}
                className="motion-slide-fade-in grid grid-cols-12 items-center bg-white/80 p-2 rounded-xl text-[11px] border border-amber-200/80 shadow-sm"
                style={{ animation: "slide-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <div className="col-span-2 text-slate-600 font-mono text-[10px] font-semibold">
                  #{rounds.length - index}
                </div>
                <div className="col-span-2 font-bold text-blue-900">+{r.pts1}</div>
                <div className="col-span-2 font-bold text-red-900">+{r.pts2}</div>
                <div className="col-span-2 font-bold text-emerald-900">+{r.pts3}</div>
                <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-[10px]">
                  {r.total1}-{r.total2}-{r.total3}
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => removeRoundById(r.id)}
                    className="min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-red-600 transition"
                    title="Obriši ruku"
                    aria-label={`Obriši ruku ${rounds.length - index}`}
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
          className={`w-full min-h-11 bg-transparent hover:bg-felt-panel/50 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition uppercase tracking-wider ${accent.resetButton}`}
        >
          <RefreshCw size={14} /> Nova igra
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
              <h3 className="font-bold text-base text-slate-900 font-serif">Započeti novu igru?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Ovo će poništiti rezultate i povijest ruku za trenutnu igru.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-amber-200/80 hover:bg-amber-200 text-slate-800 font-bold rounded-xl text-xs active:scale-95 transition"
              >
                Odustani
              </button>
              <button
                onClick={() => resetGame(true)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/20 active:scale-95 transition"
              >
                Potvrdi
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
                POBJEDA! 🎉
              </h2>
              <p className="text-base font-bold text-amber-900 mt-1">
                {winnerIndex !== null ? playerNames[winnerIndex] : ""} pobjeđuje!
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Konačni rezultat:{" "}
                <strong className="text-slate-900">
                  {scores[0]}-{scores[1]}-{scores[2]}
                </strong>{" "}
                (Cilj {targetScore} b)
              </p>
              {roastLine && (
                <p className="text-base italic text-orange-800/80 mt-2 border-t border-amber-300/60 pt-2">
                  {roastLine}
                </p>
              )}
            </div>
            <button
              onClick={() => resetGame(false)}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md border border-amber-500/40"
            >
              Nova igra
            </button>
          </div>
        </div>
      )}
    </>
  );
}
