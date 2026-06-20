import { describe, it, expect } from 'vitest';
import { VOICE_CLIPS } from './voiceClips';
import { AUDIO_MANIFEST } from './audioManifest';
import { LETTERS } from '../games/letter-spotting/letterLogic';
import { LETTER_POOL } from '../games/first-letter/firstLetterLogic';
import { WORD_BANK as EN_WORD_BANK } from '../games/first-words/wordLogic';
import { ALPHABET } from '../games/abc-english/abcLogic';
import { NUMBER_WORDS } from '../games/numbers-english/numbersEnLogic';
import { COLORS } from '../games/colors-english/colorsEnLogic';
import { maxCountForLevel } from '../games/counting-fun/countingLogic';
import { CATEGORIES } from '../content/categories';
import { registerAllGames } from '../games/index';
import { allGames } from '../games/registry';

/**
 * Anti-drift guard: re-derives — from the SAME real content modules the
 * generator reads — every finite {text, lang} the app can speak at runtime, and
 * asserts each has a clip key. Adding spoken content (a word, a colour, a title)
 * without regenerating `voiceClips.ts` turns this red with a clear "run the
 * generator" hint. Mirrors `scripts/build-voice-clips.mjs`'s enumeration,
 * including category + game titles, which ARE spoken at runtime
 * (AdventureMap speaks `category.title`; CategoryScreen speaks the game `title`).
 */
function requiredSpokenClips(): Array<{ lang: string; text: string }> {
  const out: Array<{ lang: string; text: string }> = [];
  const add = (lang: string, text: string): void => {
    out.push({ lang, text: text.trim() });
  };

  // 20 manifest voice lines.
  for (const entry of Object.values(AUDIO_MANIFEST.voices)) add(entry.lang, entry.text);
  // counting-fun: 1..10 (top level max).
  for (let n = 1; n <= maxCountForLevel(3); n++) add('vi-VN', String(n));
  // Vietnamese letters (letter-spotting 29 ∪ first-letter pool).
  for (const l of [...LETTERS, ...LETTER_POOL]) add('vi-VN', l);
  // first-words English words, all levels.
  for (const level of [1, 2, 3] as const) for (const item of EN_WORD_BANK[level]) add('en-US', item.word);
  // abc-english A–Z.
  for (const l of ALPHABET) add('en-US', l);
  // numbers-english one..ten.
  for (const w of Object.values(NUMBER_WORDS)) add('en-US', w);
  // colors-english colour names.
  for (const c of COLORS) add('en-US', c.name);

  // Category titles — AdventureMap speaks `category.title` (all vi-VN).
  for (const cat of CATEGORIES) add('vi-VN', cat.title);
  // Game titles — CategoryScreen speaks the game `title`. English titles read in
  // en-US, the rest in vi-VN (mirrors the generator's EN_TITLES split).
  registerAllGames();
  const EN_TITLES = new Set(['ABC', 'Colors', 'First Words', 'Numbers 1–10']);
  for (const game of allGames()) add(EN_TITLES.has(game.title) ? 'en-US' : 'vi-VN', game.title);

  return out;
}

describe('VOICE_CLIPS coverage', () => {
  it('has a clip for every finite line the app speaks at runtime', () => {
    const missing = requiredSpokenClips()
      .map(({ lang, text }) => `${lang}|${text}`)
      .filter((key) => !(key in VOICE_CLIPS));
    expect(
      missing,
      `Missing voice clips — run: npx tsx scripts/build-voice-clips.mjs\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('keeps the Vietnamese-letter clip keyed by the RAW letter (not the spoken name)', () => {
    // The generator feeds Piper the letter-NAME ("đê") but the lookup key, which
    // the app passes to speakText, must stay the raw glyph.
    expect(VOICE_CLIPS).toHaveProperty('vi-VN|Đ');
    expect(VOICE_CLIPS).not.toHaveProperty('vi-VN|đê');
  });

  it('every clip URL is a bundled /voice/<hash>.mp3 path (no network)', () => {
    for (const url of Object.values(VOICE_CLIPS)) {
      expect(url).toMatch(/^\/voice\/[0-9a-f]+\.mp3$/);
    }
  });

  it('does NOT try to pre-record unbounded content (child names use Web Speech fallback)', () => {
    // Child names are typed by parents → infinite → intentionally excluded from
    // the clip set. A representative name must therefore have no clip.
    expect(VOICE_CLIPS).not.toHaveProperty('vi-VN|Bông');
  });
});
