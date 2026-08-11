import { useState } from "react";
import {
  Trophy,
  RotateCcw,
  History,
  RefreshCw,
  ListOrdered,
  AlertTriangle,
  Trash2,
  PartyPopper,
} from "lucide-react";
import { playSound } from "../sound.js";
import { LOSING_JABS, ROAST_LINES, pickRandom } from "../banter.js";
import TeamCard from "../components/TeamCard.jsx";
import { MODE_ACCENTS } from "../modeAccents.js";
import {
  PARTIJA_POOL,
  WIN_THRESHOLD,
  PARTIJE_PER_MATCH,
  CARD_POINTS,
  BANTER_GAP_THRESHOLD,
  computePartijaWinner,
  computeMatchStatus,
  recalcPartijaTotals,
} from "./briskula.js";

export default function BriskulaBoard({
  soundEnabled,
  banterEnabled,
  team1Name,
  team2Name,
  onTeam1NameChange,
  onTeam2NameChange,
  state,
  onUpdate,
}) {
  const {
    scoreTeam1,
    scoreTeam2,
    rounds,
    partijeWon1,
    partijeWon2,
    currentPartija,
    completedPartije,
  } = state;

  const accent = MODE_ACCENTS.briskula;

  const [partijaTieNotice, setPartijaTieNotice] = useState(false);
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);

  const [partijaCompleteInfo, setPartijaCompleteInfo] = useState(null);
  const [showMatchWinnerModal, setShowMatchWinnerModal] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const scoringLocked = !!partijaCompleteInfo || showMatchWinnerModal;

  const checkPartijaCondition = (updated1, updated2) => {
    const winner = computePartijaWinner(updated1, updated2, team1Name, team2Name);
    const gap = Math.abs(updated1 - updated2);

    if (winner === null) {
      const total = updated1 + updated2;
      const isTie = total >= PARTIJA_POOL && updated1 === updated2;
      setPartijaTieNotice(isTie);
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD) {
        const loserName = updated1 < updated2 ? team1Name : team2Name;
        setBanterJab(pickRandom(LOSING_JABS, loserName, gap));
      } else {
        setBanterJab(null);
      }
      return;
    }

    setPartijaTieNotice(false);
    setBanterJab(null);

    const partijaNumber = currentPartija;
    const completedEntry = { partijaNumber, score1: updated1, score2: updated2, winner };
    const newPartijeWon1 = partijeWon1 + (winner === team1Name ? 1 : 0);
    const newPartijeWon2 = partijeWon2 + (winner === team2Name ? 1 : 0);
    const status = computeMatchStatus(newPartijeWon1, newPartijeWon2, team1Name, team2Name);

    onUpdate({
      completedPartije: [completedEntry, ...completedPartije],
      partijeWon1: newPartijeWon1,
      partijeWon2: newPartijeWon2,
    });

    if (soundEnabled) playSound("win");

    if (status.matchOver) {
      if (banterEnabled && status.matchWinner) {
        const loserName = status.matchWinner === team1Name ? team2Name : team1Name;
        setRoastLine(pickRandom(ROAST_LINES, loserName, Math.abs(newPartijeWon1 - newPartijeWon2)));
      } else {
        setRoastLine(null);
      }
      setMatchResult(status);
      setShowMatchWinnerModal(true);
    } else {
      setPartijaCompleteInfo({ partijaNumber, winner, score1: updated1, score2: updated2 });
    }
  };

  // Shared by card-value quick-add and manual entry — both just log a
  // round with different `details` phrasing.
  const addPoints = (team, value, details) => {
    if (soundEnabled) playSound("tap");

    const pts1 = team === 1 ? value : 0;
    const pts2 = team === 1 ? 0 : value;
    const updated1 = scoreTeam1 + pts1;
    const updated2 = scoreTeam2 + pts2;

    const roundEntry = {
      id: Date.now(),
      pts1,
      pts2,
      total1: updated1,
      total2: updated2,
      details,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onUpdate({ rounds: [roundEntry, ...rounds], scoreTeam1: updated1, scoreTeam2: updated2 });
    if (soundEnabled) playSound("score");
    checkPartijaCondition(updated1, updated2);
  };

  const addCardPoints = (team, value, cardName) => {
    if (scoringLocked) return;
    addPoints(team, value, `${team === 1 ? team1Name : team2Name} +${value} (${cardName})`);
  };

  // Manual entry: for when typing a number is faster than tapping through
  // several card buttons (e.g. tallying a few tricks at once). Clamped to
  // the 120-point pool as a sanity bound, same spirit as Trešeta's clamp11.
  const [manualPts, setManualPts] = useState("");
  const clampManual = (n) => Math.min(PARTIJA_POOL, Math.max(0, n));

  const handleManualPtsChange = (val) => {
    if (val === "") {
      setManualPts("");
      return;
    }
    setManualPts(clampManual(parseInt(val) || 0).toString());
  };

  const addManualPoints = (team) => {
    if (scoringLocked || manualPts === "") return;
    const value = clampManual(parseInt(manualPts) || 0);
    if (value <= 0) return;
    addPoints(team, value, `${team === 1 ? team1Name : team2Name} +${value} (Manual)`);
    setManualPts("");
  };

  const removeRoundById = (id) => {
    if (scoringLocked) return;
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2 } = recalcPartijaTotals(filtered);
    onUpdate({ rounds: recalculated, scoreTeam1: total1, scoreTeam2: total2 });
    checkPartijaCondition(total1, total2);
  };

  const undoLastRound = () => {
    if (rounds.length === 0) return;
    removeRoundById(rounds[0].id);
  };

  const startNextPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [], currentPartija: currentPartija + 1 });
    setPartijaCompleteInfo(null);
  };

  const replayTiedPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setPartijaTieNotice(false);
  };

  // Resets the whole match: partije won, current partija, and completed
  // partije history. Mirrors Trešeta's resetGame(fullReset) shape.
  const resetMatch = (fullReset) => {
    if (soundEnabled) playSound("tap");
    onUpdate({
      scoreTeam1: 0,
      scoreTeam2: 0,
      rounds: [],
      partijeWon1: 0,
      partijeWon2: 0,
      currentPartija: 1,
      completedPartije: [],
    });
    setShowMatchWinnerModal(false);
    setPartijaCompleteInfo(null);
    setBanterJab(null);
    setRoastLine(null);
    setMatchResult(null);
    if (fullReset) {
      setShowConfirmModal(false);
      setPartijaTieNotice(false);
    }
  };

  return (
    <>
      {/* Partija / Match progress indicator */}
      <div className={`bg-felt-panel/80 border ${accent.progressBorder} p-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold text-felt-ink-muted shadow-inner`}>
        <span>
          🃏 Partija {Math.min(currentPartija, PARTIJE_PER_MATCH)} of {PARTIJE_PER_MATCH}
        </span>
        <span className={`font-mono ${accent.progressText}`}>
          Partije Won: {partijeWon1} - {partijeWon2}
        </span>
      </div>

      {partijaTieNotice && (
        <div
          className="motion-slide-fade-in bg-amber-500/20 border border-amber-500/60 text-felt-ink text-xs font-semibold rounded-xl px-3 py-2 text-center flex items-center justify-between gap-2"
          style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <span>Partija tied {scoreTeam1}-{scoreTeam2} — replay it.</span>
          <button
            onClick={replayTiedPartija}
            className="shrink-0 px-2 py-1 bg-amber-500/30 hover:bg-amber-500/40 rounded-lg text-[11px] font-bold"
          >
            Replay
          </button>
        </div>
      )}

      {banterJab && (
        <div
          className="motion-slide-fade-in bg-orange-500/15 border border-orange-500/40 text-felt-banter-ink text-xs font-semibold rounded-xl px-3 py-2 text-center italic"
          style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          🔥 {banterJab}
        </div>
      )}

      {partijaCompleteInfo && (
        <div
          className={`motion-slide-fade-in bg-felt-panel/60 border ${accent.bannerBorder} ${accent.bannerText} text-xs font-semibold rounded-xl px-3 py-2.5 text-center space-y-2`}
          style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <p>
            🏁 Partija {partijaCompleteInfo.partijaNumber} complete — {partijaCompleteInfo.winner}{" "}
            wins {partijaCompleteInfo.score1}-{partijaCompleteInfo.score2}!
          </p>
          <button
            onClick={startNextPartija}
            className={`w-full py-2 ${accent.primaryButton} font-bold rounded-xl text-xs active:scale-95 transition`}
          >
            Start Next Partija
          </button>
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
          scoreSuffix={`/ ${WIN_THRESHOLD} to Win`}
          wonLabel="Partije Won"
          wonCount={partijeWon1}
          accentColor="blue"
        />
        <TeamCard
          icon="🍷"
          label="Team B"
          name={team2Name}
          onNameChange={onTeam2NameChange}
          namePlaceholder="Them"
          score={scoreTeam2}
          scoreSuffix={`/ ${WIN_THRESHOLD} to Win`}
          wonLabel="Partije Won"
          wonCount={partijeWon2}
          accentColor="red"
        />
      </div>

      {/* CARD POINTS — full-width rows (not split across the two half-width
          cards) so each of the 5 buttons stays a comfortable tap target. */}
      <div className="bg-felt-panel/60 border border-rose-500/30 rounded-2xl p-3 space-y-2.5 shadow-inner">
        <span className="text-[10px] font-bold text-felt-ink-rose/80 uppercase tracking-wider font-mono block px-1">
          Card Points
        </span>
        {[
          { team: 1, name: team1Name, nameCls: "text-blue-200", btnCls: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300/60" },
          { team: 2, name: team2Name, nameCls: "text-red-200", btnCls: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300/60" },
        ].map(({ team, name, nameCls, btnCls }) => (
          <div key={team} className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold w-12 shrink-0 truncate ${nameCls}`}>{name}</span>
            <div className="flex-1 flex items-center gap-1.5">
              {CARD_POINTS.map(({ name: cardName, short, value }) => (
                <button
                  key={short}
                  onClick={() => addCardPoints(team, value, cardName)}
                  disabled={scoringLocked}
                  className={`flex-1 min-h-11 ${btnCls} font-bold rounded-xl active:scale-95 transition shadow-sm disabled:opacity-40 disabled:active:scale-100 flex flex-col items-center justify-center leading-tight py-1`}
                >
                  <span className="text-sm">{short}</span>
                  <span className="text-[10px] opacity-80">+{value}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MANUAL POINT ENTRY — faster than tapping through several cards
          when tallying a trick's worth of points at once. */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-2xl p-3 border-2 border-amber-300/80 shadow-md space-y-2 text-slate-900">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 px-1">
          <span className="flex items-center gap-1">✍️ Manual Points</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={manualPts}
            onChange={(e) => handleManualPtsChange(e.target.value)}
            placeholder="Pts"
            aria-label="Manual points to add"
            disabled={scoringLocked}
            className="w-16 bg-white border border-amber-300 rounded-xl px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => addManualPoints(1)}
            disabled={scoringLocked || manualPts === "" || Number(manualPts) <= 0}
            className="flex-1 min-h-11 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs rounded-xl active:scale-95 transition shadow-sm disabled:opacity-40 disabled:active:scale-100"
          >
            + {team1Name}
          </button>
          <button
            type="button"
            onClick={() => addManualPoints(2)}
            disabled={scoringLocked || manualPts === "" || Number(manualPts) <= 0}
            className="flex-1 min-h-11 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs rounded-xl active:scale-95 transition shadow-sm disabled:opacity-40 disabled:active:scale-100"
          >
            + {team2Name}
          </button>
        </div>
      </div>

      {/* THIS PARTIJA'S POINT LOG */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-3 text-slate-900">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif">
            <History size={14} className="text-amber-700" />
            This Partija ({rounds.length})
          </h2>
          {rounds.length > 0 && (
            <button
              onClick={undoLastRound}
              className="min-h-11 px-2 text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Undo Last
            </button>
          )}
        </div>

        {rounds.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-1">
            <ListOrdered size={24} className="mx-auto text-amber-800/40" />
            <p className="text-xs italic font-serif">No card points recorded yet.</p>
            <p className="text-[11px] text-slate-500">
              Tap a card button above as points are won.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {rounds.map((r, index) => (
              <div
                key={r.id}
                className="motion-slide-fade-in flex items-center justify-between bg-white/80 p-2.5 rounded-xl text-xs border border-amber-200/80 shadow-sm"
                style={{ animation: "slide-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <span className="text-slate-600 font-mono text-[11px] font-semibold">
                  #{rounds.length - index}
                </span>
                <span className="font-bold text-slate-800 flex-1 px-2 truncate">{r.details}</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {r.total1} - {r.total2}
                </span>
                <button
                  onClick={() => removeRoundById(r.id)}
                  className="min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-red-600 transition"
                  title="Delete entry"
                  aria-label={`Delete entry ${rounds.length - index}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED PARTIJE HISTORY */}
      {completedPartije.length > 0 && (
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-2 text-slate-900">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif border-b border-amber-200/80 pb-2">
            <Trophy size={14} className="text-amber-700" />
            Partije ({completedPartije.length})
          </h2>
          <div className="space-y-1.5">
            {completedPartije.map((p) => (
              <div
                key={p.partijaNumber}
                className="flex items-center justify-between bg-white/80 p-2 rounded-xl text-xs border border-amber-200/80"
              >
                <span className="text-slate-600 font-mono text-[11px] font-semibold">
                  Partija {p.partijaNumber}
                </span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {p.score1} - {p.score2}
                </span>
                <span className="font-bold text-amber-800 text-[11px]">{p.winner} won</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Action */}
      <div className="pt-1">
        <button
          onClick={() => {
            if (soundEnabled) playSound("tap");
            setShowConfirmModal(true);
          }}
          className={`w-full min-h-11 bg-transparent hover:bg-felt-panel/50 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition uppercase tracking-wider ${accent.resetButton}`}
        >
          <RefreshCw size={14} /> New Match
        </button>
      </div>

      {/* Confirmation Modal for Match Reset */}
      {showConfirmModal && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className={`motion-modal-in bg-amber-50 border-2 ${accent.confirmModalBorder} rounded-3xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl text-slate-900`}
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${accent.confirmModalIcon}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-serif">Start New Match?</h3>
              <p className="text-xs text-slate-600 mt-1">
                This will reset the current partija, partije won, and match history.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`flex-1 py-2.5 text-slate-800 font-bold rounded-xl text-xs active:scale-95 transition ${accent.confirmModalCancel}`}
              >
                Cancel
              </button>
              <button
                onClick={() => resetMatch(true)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/20 active:scale-95 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Winner Modal */}
      {showMatchWinnerModal && matchResult && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className={`motion-modal-in bg-gradient-to-b from-amber-50 to-amber-100 border-2 ${accent.winModalBorder} rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl text-slate-900`}
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className={`w-16 h-16 bg-gradient-to-tr rounded-full flex items-center justify-center mx-auto shadow-lg ${accent.winModalIconCircle}`}>
              {matchResult.sweep ? <PartyPopper size={32} /> : <Trophy size={32} />}
            </div>
            <div>
              {matchResult.tied ? (
                <>
                  <h2 className="text-xl font-black text-slate-900 font-serif tracking-wide">
                    MATCH TIED 2-2
                  </h2>
                  <p className="text-xs text-slate-600 mt-2">
                    Play another partija to break the tie, or start a new match.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black text-slate-900 font-serif tracking-wide">
                    {matchResult.sweep ? "ČESALJ! SWEEP! 🎉" : "MATCH WON! 🎉"}
                  </h2>
                  <p className={`text-base font-bold mt-1 ${accent.winModalHeading}`}>
                    {matchResult.matchWinner} wins the match!
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Partije: <strong className="text-slate-900">{partijeWon1}</strong> to{" "}
                    <strong className="text-slate-900">{partijeWon2}</strong>
                  </p>
                  {roastLine && (
                    <p className={`text-xs italic text-orange-800/80 mt-2 border-t pt-2 ${accent.winModalDivider}`}>
                      🔥 {roastLine}
                    </p>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => resetMatch(false)}
              className={`w-full py-3 bg-emerald-900 hover:bg-emerald-800 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md border ${accent.winModalButtonBorder}`}
            >
              Start New Match
            </button>
          </div>
        </div>
      )}
    </>
  );
}
