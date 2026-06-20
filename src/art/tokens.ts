/**
 * KiddyHub — Style bible as code (Giai đoạn 4 · Phần B).
 *
 * Single source of truth for the final illustrated look: cartoon bo tròn
 * (rounded), mắt to (big friendly eyes), màu pastel tươi sáng (bright pastel),
 * nét viền mềm (soft outline). Every SVG asset (mascot, chrome, islands,
 * avatars, icons) imports from here so the whole app stays on-brand.
 *
 * Nothing in `src/art/*` should hard-code a colour, stroke or radius —
 * import the token instead. See the spec:
 *   docs/superpowers/specs/2026-06-20-kiddyhub-phase-4b-final-art.md
 */

/**
 * Brand palette. The six `island.*` hues are kept identical to the existing
 * category colours (`src/content/categories.ts`) so islands stay on-brand when
 * B2 redraws them. Everything else is a pastel that harmonises with those.
 */
export const palette = {
  // Six island / category accents — MUST match src/content/categories.ts.
  island: {
    numbers: '#ff8fab', // pink
    letters: '#7cc6fe', // sky blue
    logic: '#ffb703', // amber
    memory: '#b388ff', // lavender
    shapes: '#06d6a0', // mint
    english: '#ff7043', // coral
  },

  // App-wide roles.
  primary: '#ff8c42', // Cáo orange — the brand's signature warm hue
  accent: '#7cc6fe', // friendly sky blue (CTAs, highlights)
  background: '#fef6ec', // warm cream page background
  backgroundSky: '#bfeaff', // soft sky for map/scene backdrops
  surface: '#ffffff', // cards / tiles
  ink: '#5b4636', // dark warm brown — text & soft outlines (not pure black)
  inkSoft: '#8a7563', // muted brown for secondary text
  star: '#ffd166', // reward gold
  success: '#06d6a0', // correct (mint)
  error: '#ff8fab', // gentle "try again" pink (never harsh red)
  white: '#ffffff',
} as const;

/**
 * Cáo (fox) mascot colours. Orange body, cream belly/cheeks/tail-tip,
 * dark-brown ink outline + facial features. Friendly, warm, never garish.
 */
export const fox = {
  body: '#ff8c42', // main orange fur
  bodyDark: '#f4762a', // shaded orange (ear backs, tail base)
  cream: '#fff3e2', // belly, cheeks, inner ears, tail tip
  ink: '#5b4636', // outline + nose + eye outline (warm dark brown)
  blush: '#ffb3a7', // soft cheek blush
  eyeShine: '#ffffff', // catch-light in the eye
  white: '#ffffff', // eye white
} as const;

/**
 * Shared geometry — keeps every asset's "weight" consistent.
 * Values are in the asset's own 0..100 design-unit viewBox (see ART_VIEWBOX).
 */
export const stroke = {
  /** Default soft outline width. */
  width: 3,
  /** Thinner inner detail (eye outlines, fur lines). */
  thin: 2,
  /** Heavier outline for large hero shapes. */
  bold: 4,
  /** Rounded line caps/joins everywhere = soft, kid-friendly. */
  linecap: 'round' as const,
  linejoin: 'round' as const,
} as const;

/** Corner radii (design units) for cards, tiles, buttons. */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/**
 * Character proportions for the Cáo mascot, expressed as fractions of the
 * design viewBox. Big head + big eyes = cute. Tweaking these reshapes the
 * mascot consistently across all poses.
 */
export const proportion = {
  /** Head diameter as a fraction of the viewBox. */
  headRatio: 0.52,
  /** Eye radius as a fraction of head diameter (large = friendly). */
  eyeRatio: 0.16,
  /** Pupil radius as a fraction of eye radius. */
  pupilRatio: 0.62,
  /** Body height as a fraction of the viewBox. */
  bodyRatio: 0.4,
} as const;

/**
 * Canonical design viewBox edge. All art is authored on a square
 * `0 0 100 100` grid, then scaled by the adapters. Keeping one number means
 * tokens like `stroke.width` read the same in every file.
 */
export const ART_VIEWBOX = 100;

export type Palette = typeof palette;
export type FoxColors = typeof fox;
export type IslandKey = keyof typeof palette.island;
