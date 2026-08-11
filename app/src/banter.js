// Mid-game jabs, shown while a team is down by a game-specific gap
// threshold but nobody has won yet. Each takes the losing team's name
// and the gap. Written in a Michael Scott (The Office) register —
// earnest, awkward, backhanded, oversharing — as original lines, not
// show quotes.
export const LOSING_JABS = [
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
export const ROAST_LINES = [
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

export const pickRandom = (pool, ...args) => {
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line(...args);
};
