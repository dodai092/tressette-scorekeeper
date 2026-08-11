import { Pencil } from "lucide-react";

const TEAM_ACCENTS = {
  blue: {
    label: "text-blue-800",
    text: "text-blue-900",
    border: "border-blue-200 focus:border-blue-600",
    ring: "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
    gamesWon: "text-blue-900",
    quickBtn: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300/60",
  },
  red: {
    label: "text-red-800",
    text: "text-red-900",
    border: "border-red-200 focus:border-red-600",
    ring: "focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1",
    gamesWon: "text-red-900",
    quickBtn: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300/60",
  },
};

// Shared scorecard for both games. scoreSuffix and wonLabel let each game
// phrase the sub-labels in its own terms (e.g. "/ 41 Points" + "Games Won"
// for Trešeta vs "/ 61 to Win" + "Partije Won" for Briškula). quickAmounts
// is a list of { value, top, bottom } — top is optional; when present the
// button stacks a short label (e.g. a card name) over the point value,
// which is how Briškula's card buttons work. Trešeta omits top and gets
// a single centered line, unchanged from before.
export default function TeamCard({
  icon,
  label,
  name,
  onNameChange,
  namePlaceholder,
  score,
  scoreSuffix,
  wonLabel,
  wonCount,
  accentColor,
  onQuickAdd,
  quickAmounts,
  quickAddHeading,
  disabled,
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
              className={`bg-transparent font-black text-xl ${accent.text} tracking-tight w-full outline-none border-b border-dashed ${accent.border} ${accent.ring} rounded-sm py-0.5 pr-5 font-serif`}
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
            {scoreSuffix}
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">
            {wonLabel}: <strong className={accent.gamesWon}>{wonCount}</strong>
          </p>
        </div>
      </div>

      {quickAmounts && quickAmounts.length > 0 && (
        <div className="pt-2 border-t border-amber-200/80 space-y-1 mt-2">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
            {quickAddHeading}
          </span>
          <div className="flex items-center gap-1.5 justify-between">
            {quickAmounts.map(({ value, top, bottom }) => (
              <button
                key={value}
                onClick={() => onQuickAdd(value)}
                disabled={disabled}
                className={`flex-1 min-h-11 ${accent.quickBtn} font-bold rounded-xl active:scale-95 transition shadow-sm disabled:opacity-40 disabled:active:scale-100 ${
                  top ? "flex flex-col items-center justify-center leading-tight py-1" : "text-xs"
                }`}
              >
                {top ? (
                  <>
                    <span className="text-sm">{top}</span>
                    <span className="text-[10px] opacity-80">{bottom}</span>
                  </>
                ) : (
                  bottom
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
