import { useEffect, useState } from "react";

const DURATION_SECONDS = 10;

// Big card that floats over the score area while a team is meaningfully
// behind. Auto-dismisses when the countdown hits 0, or immediately on
// tap (backdrop or the × button) — same onDismiss either way.
//
// Uses the same parchment surface + mode-accent border as the other
// modals (confirm/winner), with the orange "banter ink" reserved for
// text only — this is a modal, not a third mode color.
export default function BanterOverlay({ line, onDismiss, accent }) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);

  useEffect(() => {
    setSecondsLeft(DURATION_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [line]);

  // Separate effect so the parent's setState (removing the jab) never
  // fires from inside this component's own interval-driven state update.
  useEffect(() => {
    if (secondsLeft === 0) onDismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <div
      className="motion-fade-in absolute inset-0 z-20 bg-slate-950/55 backdrop-blur-[1px] rounded-3xl flex items-center justify-center p-4"
      style={{ animation: "fade-in 180ms ease-out" }}
      onClick={onDismiss}
    >
      <div
        className={`motion-modal-in relative bg-gradient-to-b from-amber-50 to-amber-100 border-2 ${accent.winModalBorder} rounded-2xl px-5 pt-7 pb-4 max-w-xs w-full text-center shadow-2xl`}
        style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          aria-label="Zatvori"
          className="absolute top-2 right-2 min-w-6 min-h-6 w-6 h-6 rounded-full border border-slate-900/15 bg-slate-900/5 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xs active:scale-95 transition"
        >
          ✕
        </button>
        <p className="text-lg font-bold italic text-orange-800/80 leading-snug">{line}</p>
        <p className="mt-3 font-mono font-extrabold text-xl text-orange-700 tracking-wide">
          {String(secondsLeft).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
