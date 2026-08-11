// Banter lines: old Triestine card-table sayings, shown both mid-game
// (as a big overlay card while a team is meaningfully behind) and at
// match end (inside the winner modal). One shared pool — these aren't
// written for a specific loser or gap, they're standalone proverbs.
export const BANTER_LINES = [
  "Neće karta poštena čov'ka;",
  "Ćorak, ćorak…i najveći ćorak.",
  "Kartate 'el? E da da, da ne bi zaboravli.",
  "Ne bi ni u WC-u bili gladni.",
  "Majke't janje i suhog Franje.",
  "Akuža'j najstarija…",
  "To j' igrački.",
  "Riskir, profitir!",
  "Dane, kočiš igru.",
  "Taman da se iščistin lišina…",
];

export const pickRandom = (pool, exclude) => {
  const options = exclude != null && pool.length > 1 ? pool.filter((line) => line !== exclude) : pool;
  return options[Math.floor(Math.random() * options.length)];
};
