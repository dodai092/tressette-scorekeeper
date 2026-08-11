// Mirrors the shape of TeamCard's TEAM_ACCENTS, but for the two game
// modes rather than the two teams. Gold Leaf / Garnet per DESIGN.md —
// centralized here so a future accent change is one edit, not a grep.
export const MODE_ACCENTS = {
  treseta: {
    activeTab: "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950",
    progressBorder: "border-amber-500/30",
    progressText: "text-amber-300",
    bannerBorder: "border-amber-500/50",
    bannerText: "text-amber-100",
    primaryButton: "bg-amber-500/90 hover:bg-amber-500 text-slate-950",
    resetButton: "text-felt-ink/70 hover:text-felt-ink border-amber-500/25",
    confirmModalBorder: "border-amber-300",
    confirmModalIcon: "bg-amber-100 text-amber-700 border-amber-300",
    confirmModalCancel: "bg-amber-200/80 hover:bg-amber-200",
    winModalBorder: "border-amber-400",
    winModalIconCircle: "from-amber-500 to-yellow-300 text-slate-950 shadow-amber-500/30",
    winModalHeading: "text-amber-900",
    winModalDivider: "border-amber-300/60",
    winModalButtonBorder: "border-amber-500/40 text-amber-200",
  },
  briskula: {
    activeTab: "bg-gradient-to-r from-rose-600 to-rose-500 text-white",
    progressBorder: "border-rose-500/40",
    progressText: "text-felt-ink-rose",
    bannerBorder: "border-rose-500/50",
    bannerText: "text-felt-ink-rose",
    primaryButton: "bg-rose-600 hover:bg-rose-500 text-white",
    resetButton: "text-felt-ink-rose/70 hover:text-felt-ink-rose border-rose-500/30",
    confirmModalBorder: "border-rose-300",
    confirmModalIcon: "bg-rose-100 text-rose-700 border-rose-300",
    confirmModalCancel: "bg-rose-100 hover:bg-rose-200",
    winModalBorder: "border-rose-400",
    winModalIconCircle: "from-rose-600 to-rose-400 text-white shadow-rose-500/30",
    winModalHeading: "text-rose-800",
    winModalDivider: "border-rose-300/60",
    winModalButtonBorder: "border-rose-500/40 text-rose-200",
  },
};
