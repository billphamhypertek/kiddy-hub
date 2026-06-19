export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const TOKENS: string[] = ['🔴', '🔵', '🟡', '🟢', '🟣'];

export interface PatternRound {
  sequence: string[]; // visible prefix; the scene shows a "?" after it
  answer: string; // the token that fills the missing last cell
  options: string[];
}

export function optionCountForLevel(level: number): number {
  return level >= 3 ? 4 : 3;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

/** Returns `n` distinct tokens chosen via rng. */
function distinctTokens(n: number, rng: Rng): string[] {
  const chosen: string[] = [];
  let guard = 0;
  while (chosen.length < n && guard++ < 200) {
    const t = pick(TOKENS, rng);
    if (!chosen.includes(t)) chosen.push(t);
  }
  for (let i = 0; chosen.length < n; i++) {
    if (!chosen.includes(TOKENS[i % TOKENS.length])) chosen.push(TOKENS[i % TOKENS.length]);
  }
  return chosen;
}

/** Builds the repeating unit for the level, e.g. [A,B] / [A,B,C] / [A,A,B,B]. */
function unitForLevel(level: number, rng: Rng): string[] {
  if (level <= 1) return distinctTokens(2, rng); // AB
  if (level === 2) return distinctTokens(3, rng); // ABC
  // L3: choose AABB or ABB
  const [a, b] = distinctTokens(2, rng);
  return rng() < 0.5 ? [a, a, b, b] : [a, b, b];
}

export function generateRound(level: number, rng: Rng): PatternRound {
  const unit = unitForLevel(level, rng);
  // Show enough cells that the rule is visible: ~2 units, at least 3 cells,
  // then the NEXT cell is the hidden answer.
  const visibleLen = Math.max(3, unit.length * 2 - 1);
  const full: string[] = [];
  for (let i = 0; i < visibleLen + 1; i++) full.push(unit[i % unit.length]);
  const sequence = full.slice(0, visibleLen);
  const answer = full[visibleLen];

  const options = new Set<string>([answer]);
  // Prefer the other tokens in the unit as distractors, then random tokens.
  for (const t of unit) if (options.size < optionCountForLevel(level)) options.add(t);
  let guard = 0;
  while (options.size < optionCountForLevel(level) && guard++ < 200) {
    options.add(pick(TOKENS, rng));
  }
  for (let i = 0; options.size < optionCountForLevel(level); i++) {
    options.add(TOKENS[i % TOKENS.length]);
  }

  return { sequence, answer, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
