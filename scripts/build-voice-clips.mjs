/**
 * Generates the pre-recorded voice clips (Piper TTS → mp3) and the clip index
 * `src/audio/voiceClips.ts` (GĐ5A).
 *
 * WHY: Web Speech reads Vietnamese with an English voice on Chromium-macOS
 * (Chrome/Cốc Cốc/Edge expose no `vi-VN` voice). Pre-recording every finite
 * spoken line with Piper fixes the voice on ALL browsers and makes the runtime
 * fully offline (it only plays bundled mp3s; Web Speech stays as a fallback for
 * unbounded content like child names).
 *
 * DRY: this script does NOT hard-code word lists — it imports the REAL content
 * modules (manifest, counting/letter/word/abc/numbers/colors logic, categories,
 * game registry) and enumerates the unique {text, lang} set so the clip set can
 * never drift from what the app actually speaks. `voiceClips.test.ts` re-derives
 * the same set and fails red if a clip is missing.
 *
 * This is a one-time LOCAL tool (like build-pwa-icons.mjs). Production build /
 * CI / Docker never need Piper or ffmpeg — the mp3s + index are committed.
 *
 * Run with tsx (handles the .ts content imports):
 *   npx tsx scripts/build-voice-clips.mjs
 *
 * Tool deps (local only): Piper via the venv at scripts/.piper-cache/venv (PEP
 * 668 — Homebrew Python is externally-managed), models under scripts/.piper-cache,
 * and ffmpeg (brew). All overridable via env (PIPER_VENV / PIPER_VI_MODEL / …).
 *
 * Output:
 *   public/voice/<hash>.mp3    — one mp3 per unique {lang|text} (committed)
 *   src/audio/voiceClips.ts    — VOICE_CLIPS: ClipIndex (committed; auto-generated)
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// REAL content modules — the single source of truth for what the app speaks.
import { AUDIO_MANIFEST } from '../src/audio/audioManifest.ts';
import { LETTERS } from '../src/games/letter-spotting/letterLogic.ts';
import { LETTER_POOL } from '../src/games/first-letter/firstLetterLogic.ts';
import { WORD_BANK as EN_WORD_BANK } from '../src/games/first-words/wordLogic.ts';
import { ALPHABET } from '../src/games/abc-english/abcLogic.ts';
import { NUMBER_WORDS } from '../src/games/numbers-english/numbersEnLogic.ts';
import { COLORS } from '../src/games/colors-english/colorsEnLogic.ts';
import { maxCountForLevel } from '../src/games/counting-fun/countingLogic.ts';
import { CATEGORIES } from '../src/content/categories.ts';
import { registerAllGames } from '../src/games/index.ts';
import { allGames } from '../src/games/registry.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const voiceDir = resolve(__dirname, '../public/voice');
const indexPath = resolve(__dirname, '../src/audio/voiceClips.ts');
const cacheDir = resolve(__dirname, '.piper-cache');

// Piper toolchain — env-overridable, defaulting to the local de-risk cache.
const VENV_PYTHON = process.env.PIPER_VENV || resolve(cacheDir, 'venv/bin/python');
const VI_MODEL = process.env.PIPER_VI_MODEL || resolve(cacheDir, 'vi_VN-vais1000-medium.onnx');
const EN_MODEL = process.env.PIPER_EN_MODEL || resolve(cacheDir, 'en_US-amy-medium.onnx');
const VI_CFG = `${VI_MODEL}.json`;
const EN_CFG = `${EN_MODEL}.json`;
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

/**
 * The ONLY place where the app-string differs from the Piper input: the 29
 * Vietnamese letters. Read raw, Piper mangles single letters (e.g. "G" → "ðe7",
 * "H" → "hát"), so we feed the Vietnamese letter-NAME instead. The clip KEY
 * stays the raw letter (e.g. 'vi-VN|Đ'); only the synth input changes.
 *
 * Everything else (Vietnamese digits "1".."10", English letters/words/colours/
 * number-words, all manifest sentences, category/game titles) reads correctly
 * raw, so it maps to itself (identity) — verified during de-risk.
 */
const VI_LETTER_NAME = {
  A: 'a', Ă: 'á', Â: 'ớ', B: 'bê', C: 'xê', D: 'dê', Đ: 'đê', E: 'e', Ê: 'ê',
  G: 'gờ', H: 'hờ', I: 'i', K: 'ca', L: 'lờ', M: 'mờ', N: 'nờ', O: 'o', Ô: 'ô',
  Ơ: 'ơ', P: 'pê', Q: 'cu', R: 'rờ', S: 'sờ', T: 'tờ', U: 'u', Ư: 'ư', V: 'vê',
  X: 'xờ', Y: 'i dài',
};

/** Build the unique {lang, text, piperInput, extra} clip spec from real content. */
function enumerateClips() {
  registerAllGames();
  /** @type {Map<string, {lang:string, text:string, piperInput:string, extra:boolean}>} */
  const byKey = new Map();

  // `add` keys on `${lang}|${text.trim()}` so duplicates collapse. `extra: true`
  // marks content not yet spoken at runtime (titles) — generated but excluded
  // from the mandatory coverage test.
  const add = (lang, rawText, { extra = false } = {}) => {
    const text = String(rawText).trim();
    if (!text) return;
    const key = `${lang}|${text}`;
    if (byKey.has(key)) return;
    const piperInput = lang === 'vi-VN' && text in VI_LETTER_NAME ? VI_LETTER_NAME[text] : text;
    byKey.set(key, { lang, text, piperInput, extra });
  };

  // --- Core: every finite line the app can actually speak at runtime ---

  // 20 manifest voice lines (prompt/feedback/reward). Lang lives in the entry.
  for (const entry of Object.values(AUDIO_MANIFEST.voices)) add(entry.lang, entry.text);

  // counting-fun speaks String(count), 1..max (max is 10 at the top level).
  for (let n = 1; n <= maxCountForLevel(3); n++) add('vi-VN', String(n));

  // letter-spotting speaks the 29 Vietnamese letters; first-letter speaks a
  // subset (LETTER_POOL ⊂ LETTERS) — union both to be safe.
  for (const l of [...LETTERS, ...LETTER_POOL]) add('vi-VN', l);

  // first-words speaks the English word; union all three levels.
  for (const level of [1, 2, 3]) for (const item of EN_WORD_BANK[level]) add('en-US', item.word);

  // abc-english speaks A–Z.
  for (const l of ALPHABET) add('en-US', l);

  // numbers-english speaks one..ten.
  for (const w of Object.values(NUMBER_WORDS)) add('en-US', w);

  // colors-english speaks the colour name.
  for (const c of COLORS) add('en-US', c.name);

  // --- Category + game titles: these ARE spoken at runtime (AdventureMap speaks
  // `category.title`; CategoryScreen speaks the game `title`), so their clips are
  // required (the coverage test asserts every title has a key). Kept under the
  // `extra` flag purely for the index ordering — they are NOT optional content. ---
  for (const cat of CATEGORIES) add('vi-VN', cat.title, { extra: true });
  // English game titles read fine in en-US; Vietnamese titles in vi-VN.
  const EN_TITLES = new Set(['ABC', 'Colors', 'First Words', 'Numbers 1–10']);
  for (const game of allGames()) {
    add(EN_TITLES.has(game.title) ? 'en-US' : 'vi-VN', game.title, { extra: true });
  }

  return [...byKey.values()];
}

/** Stable short filename from the clip KEY (not the Piper input). */
function hashFor(lang, text) {
  return createHash('sha1').update(`${lang}|${text.trim()}`).digest('hex').slice(0, 10);
}

/** Synthesize one clip with Piper, then encode to mono mp3. Idempotent. */
function synth(spec, tmpWav) {
  const hash = hashFor(spec.lang, spec.text);
  const outMp3 = resolve(voiceDir, `${hash}.mp3`);
  if (existsSync(outMp3)) {
    console.log('skip (exists)', `${spec.lang}|${spec.text}`, '→', `${hash}.mp3`);
    return outMp3;
  }
  const model = spec.lang === 'vi-VN' ? VI_MODEL : EN_MODEL;
  const cfg = spec.lang === 'vi-VN' ? VI_CFG : EN_CFG;
  // Piper reads text from stdin and writes a WAV to -f.
  execFileSync(VENV_PYTHON, ['-m', 'piper', '-m', model, '-c', cfg, '-f', tmpWav], {
    input: `${spec.piperInput}\n`,
    stdio: ['pipe', 'ignore', 'inherit'],
  });
  // Mono 22.05 kHz 48 kbps mp3 — small and plays everywhere (incl. Safari iPad).
  execFileSync(FFMPEG, ['-y', '-i', tmpWav, '-ac', '1', '-ar', '22050', '-b:a', '48k', outMp3], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  console.log('wrote', `${spec.lang}|${spec.text}`, '→', `${hash}.mp3`);
  return outMp3;
}

/** Emit the committed clip index. Sorted keys → stable diffs. */
function writeIndex(specs) {
  const lines = specs
    .map((s) => ({ key: `${s.lang}|${s.text.trim()}`, url: `/voice/${hashFor(s.lang, s.text)}.mp3` }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((e) => `  ${JSON.stringify(e.key)}: ${JSON.stringify(e.url)},`)
    .join('\n');
  const body = `// AUTO-GENERATED by scripts/build-voice-clips.mjs — DO NOT EDIT.
// Maps \`\${lang}|\${text.trim()}\` → bundled mp3 URL. Regenerate with:
//   npx tsx scripts/build-voice-clips.mjs
import type { ClipIndex } from './prerecordedEngine';

export const VOICE_CLIPS: ClipIndex = {
${lines}
};
`;
  writeFileSync(indexPath, body, 'utf-8');
  console.log('wrote', indexPath, `(${specs.length} clips)`);
}

function main() {
  const specs = enumerateClips();
  mkdirSync(voiceDir, { recursive: true });
  const tmpWav = resolve(tmpdir(), `kiddyhub-voice-${process.pid}.wav`);
  try {
    for (const spec of specs) synth(spec, tmpWav);
  } finally {
    rmSync(tmpWav, { force: true });
  }
  writeIndex(specs);
  console.log(`done — ${specs.length} clips in ${voiceDir}`);
}

main();
