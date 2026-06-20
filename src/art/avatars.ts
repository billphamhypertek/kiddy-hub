/**
 * KiddyHub — Avatar characters (Giai đoạn 4 · Phần B2).
 *
 * Eight cute rounded animal faces for the "Ai đang chơi?" picker, drawn in the
 * exact same style as the Cáo mascot: big friendly eyes, soft warm-brown ink
 * outline (`palette.ink`), pastel fills, rounded line caps. Each is authored on
 * the canonical 0..100 viewBox and returned as a complete `<svg>` string via
 * `svgDoc()`, so they render through `<SvgArt>` in React (and could feed Phaser).
 *
 * Keys match `src/content/avatars.ts`: cat, dog, bear, rabbit, fox, panda,
 * lion, frog. The `fox` avatar reuses the mascot's idle pose for consistency.
 */
import { svgDoc } from './svg';
import { foxIdle } from './fox';
import { palette, stroke } from './tokens';

const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = palette.ink;

/** Per-species fill colours, all pastel and harmonising with the palette. */
const fur = {
  cat: { body: '#ffc266', light: '#ffe2b0', dark: '#f0a73e' },
  dog: { body: '#d9a066', light: '#f3dcc0', dark: '#c08850' },
  bear: { body: '#b98b5e', light: '#e6cda8', dark: '#9c7048' },
  rabbit: { body: '#f4e3ef', light: '#ffffff', dark: '#e6c9dd' },
  panda: { body: '#ffffff', light: '#ffffff', dark: '#eef0f2' },
  lion: { body: '#ffcf6e', light: '#ffe6ad', dark: '#e7a23c' },
  frog: { body: '#8fd97a', light: '#c4efb0', dark: '#5fb35a' },
} as const;

/** A big friendly eye: white, dark pupil, catch-light. Matches fox.eye(). */
function eye(cx: number, cy: number, r = 7): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="${cx}" cy="${cy + 0.6}" r="${r * 0.6}" fill="${INK}"/>` +
    `<circle cx="${cx + 1.6}" cy="${cy - 1.4}" r="${r * 0.22}" fill="${palette.white}"/>`
  );
}

/** Soft pink cheek blush. */
function blush(cx: number, cy: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="4.4" fill="#ffb3a7" opacity="0.75"/>`;
}

/** Tiny rounded nose + gentle smile, shared by most faces. */
function noseSmile(cx: number, cy: number, color: string = INK): string {
  return (
    `<path d="M${cx} ${cy} c2 0 3 1.6 2 3 c-1 1.4 -3 1.4 -4 0 c-1 -1.4 0 -3 2 -3 Z" fill="${color}"/>` +
    `<path d="M${cx - 6} ${cy + 5} c3 4 9 4 12 0" fill="none" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

/** Mèo — cat: pointy ears, whiskers, little muzzle. */
function avatarCat(title: string): string {
  const c = fur.cat;
  return svgDoc(
    // ears
    `<path d="M28 30 L24 12 L42 24 Z" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M72 30 L76 12 L58 24 Z" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M30 26 L28 17 L37 23 Z" fill="#ff9eb5"/>` +
    `<path d="M70 26 L72 17 L63 23 Z" fill="#ff9eb5"/>` +
    // head
    `<circle cx="50" cy="52" r="32" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="60" rx="20" ry="16" fill="${c.light}"/>` +
    eye(39, 48) + eye(61, 48) +
    blush(33, 58) + blush(67, 58) +
    noseSmile(50, 56, '#e8757f') +
    // whiskers
    `<g stroke="${INK}" stroke-width="${SW_THIN}" fill="none">` +
    `<path d="M30 56 H16"/><path d="M31 62 H18"/>` +
    `<path d="M70 56 H84"/><path d="M69 62 H82"/></g>`,
    title,
  );
}

/** Cún — dog: floppy ears, round snout. */
function avatarDog(title: string): string {
  const c = fur.dog;
  return svgDoc(
    // floppy ears (behind head)
    `<path d="M24 38 C12 36 10 58 22 66 C30 60 30 46 30 40 Z" fill="${c.dark}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M76 38 C88 36 90 58 78 66 C70 60 70 46 70 40 Z" fill="${c.dark}" stroke="${INK}" stroke-width="${SW}"/>` +
    // head
    `<circle cx="50" cy="50" r="32" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    // patch over one eye
    `<path d="M36 36 C28 38 28 52 38 54 C46 52 46 38 36 36 Z" fill="${c.dark}" opacity="0.55"/>` +
    eye(39, 46) + eye(61, 46) +
    blush(31, 56) + blush(69, 56) +
    // snout
    `<ellipse cx="50" cy="62" rx="17" ry="13" fill="${c.light}"/>` +
    noseSmile(50, 56),
    title,
  );
}

/** Gấu — bear: round ears, warm brown. */
function avatarBear(title: string): string {
  const c = fur.bear;
  return svgDoc(
    `<circle cx="28" cy="28" r="13" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="72" cy="28" r="13" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="28" cy="28" r="6.5" fill="${c.light}"/>` +
    `<circle cx="72" cy="28" r="6.5" fill="${c.light}"/>` +
    `<circle cx="50" cy="52" r="32" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="60" rx="17" ry="14" fill="${c.light}"/>` +
    eye(40, 47) + eye(60, 47) +
    blush(31, 57) + blush(69, 57) +
    noseSmile(50, 55),
    title,
  );
}

/** Thỏ — rabbit: tall ears, buck-tooth smile. */
function avatarRabbit(title: string): string {
  const c = fur.rabbit;
  return svgDoc(
    `<path d="M38 32 C32 6 40 2 44 24 C45 30 44 34 42 36 Z" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M62 32 C68 6 60 2 56 24 C55 30 56 34 58 36 Z" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M39 30 C35 12 40 10 42 24 Z" fill="#ff9eb5"/>` +
    `<path d="M61 30 C65 12 60 10 58 24 Z" fill="#ff9eb5"/>` +
    `<circle cx="50" cy="56" r="30" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    eye(40, 52) + eye(60, 52) +
    blush(32, 62) + blush(68, 62) +
    `<path d="M50 60 c2 0 3 1.4 2 2.8 c-1 1.2 -3 1.2 -4 0 c-1 -1.4 0 -2.8 2 -2.8 Z" fill="#e8757f"/>` +
    `<path d="M50 63 v4" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    // two front teeth
    `<rect x="46" y="67" width="4" height="6" rx="1.5" fill="${palette.white}" stroke="${INK}" stroke-width="1.4"/>` +
    `<rect x="50" y="67" width="4" height="6" rx="1.5" fill="${palette.white}" stroke="${INK}" stroke-width="1.4"/>`,
    title,
  );
}

/** Cáo — fox: reuse the mascot idle pose for perfect consistency. */
function avatarFox(title: string): string {
  return foxIdle(title);
}

/** Trúc — panda: black ears & eye patches, white face. */
function avatarPanda(title: string): string {
  return svgDoc(
    `<circle cx="28" cy="26" r="13" fill="#2f2a28" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="72" cy="26" r="13" fill="#2f2a28" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="50" cy="52" r="32" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    // eye patches (teardrop)
    `<path d="M40 40 C30 42 30 56 40 58 C48 56 48 42 40 40 Z" fill="#2f2a28"/>` +
    `<path d="M60 40 C70 42 70 56 60 58 C52 56 52 42 60 40 Z" fill="#2f2a28"/>` +
    eye(40, 49, 6) + eye(60, 49, 6) +
    blush(30, 60) + blush(70, 60) +
    noseSmile(50, 60),
    title,
  );
}

/** Sư tử — lion: amber face inside a fluffy orange mane. */
function avatarLion(title: string): string {
  const c = fur.lion;
  const mane = '#e7922f';
  // mane = ring of bumps around the head
  let maneRing = `<g fill="${mane}" stroke="${INK}" stroke-width="${SW_THIN}">`;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const mx = 50 + Math.cos(a) * 33;
    const my = 52 + Math.sin(a) * 33;
    maneRing += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="9"/>`;
  }
  maneRing += '</g>';
  return svgDoc(
    maneRing +
    // ears
    `<circle cx="32" cy="32" r="8" fill="${c.body}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="68" cy="32" r="8" fill="${c.body}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="50" cy="52" r="28" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="60" rx="16" ry="13" fill="${c.light}"/>` +
    eye(41, 48) + eye(59, 48) +
    blush(33, 58) + blush(67, 58) +
    noseSmile(50, 55),
    title,
  );
}

/** Ếch — frog: green, eyes on top, wide smile. */
function avatarFrog(title: string): string {
  const c = fur.frog;
  return svgDoc(
    // eye bumps on top
    `<circle cx="34" cy="30" r="14" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="66" cy="30" r="14" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    // head
    `<path d="M18 50 C18 36 34 32 50 32 C66 32 82 36 82 50 C82 70 66 80 50 80 C34 80 18 70 18 50 Z" fill="${c.body}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="62" rx="22" ry="15" fill="${c.light}"/>` +
    eye(34, 29, 8) + eye(66, 29, 8) +
    blush(30, 58) + blush(70, 58) +
    // wide smile
    `<path d="M34 60 C42 72 58 72 66 60" fill="none" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="44" cy="50" r="1.6" fill="${INK}"/>` +
    `<circle cx="56" cy="50" r="1.6" fill="${INK}"/>`,
    title,
  );
}

/** Builder registry keyed exactly like AVATARS in src/content/avatars.ts. */
const builders: Record<string, (title: string) => string> = {
  cat: avatarCat,
  dog: avatarDog,
  bear: avatarBear,
  rabbit: avatarRabbit,
  fox: avatarFox,
  panda: avatarPanda,
  lion: avatarLion,
  frog: avatarFrog,
};

/**
 * Return a complete `<svg>` string for the given avatar key. Falls back to the
 * cat if the key is unknown. `title` becomes the SVG's accessible `<title>`;
 * pass the Vietnamese label.
 */
export function avatarArt(key: string, title = ''): string {
  return (builders[key] ?? avatarCat)(title);
}

/** Keys with a drawn avatar — handy for galleries / the style board. */
export const avatarKeys = Object.keys(builders);
