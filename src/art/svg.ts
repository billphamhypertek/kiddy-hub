/**
 * KiddyHub — SVG infrastructure (Giai đoạn 4 · Phần B1).
 *
 * One SVG source feeds BOTH React menus and Phaser scenes. This module holds
 * the framework-agnostic plumbing: a tiny SVG-string builder, a data-URI
 * encoder, and the Phaser texture/sprite adapters. The React adapter lives in
 * `Art.tsx`.
 *
 * Design notes:
 * - Art is authored on a square `0 0 ART_VIEWBOX ART_VIEWBOX` grid (see tokens)
 *   and scaled at render time, so a single source renders crisply at any size.
 * - We avoid any raster/external image — strings only, 100% local.
 */
import { ART_VIEWBOX, stroke } from './tokens';

/** A minimal Phaser surface — only the bits the adapters touch. Keeps this
 *  module importable under the test stub without pulling real Phaser types. */
export interface ArtScene {
  textures: {
    exists(key: string): boolean;
    addBase64(key: string, data: string): void;
  };
  add: {
    image(x: number, y: number, key: string): ArtImage;
  };
}

export interface ArtImage {
  setDisplaySize(width: number, height: number): ArtImage;
  setOrigin(x: number, y?: number): ArtImage;
}

/**
 * Wrap inner SVG markup in a complete, self-contained `<svg>` document on the
 * canonical viewBox. `title` becomes an accessible `<title>` element.
 */
export function svgDoc(inner: string, title?: string): string {
  const titleTag = title ? `<title>${escapeXml(title)}</title>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${ART_VIEWBOX} ${ART_VIEWBOX}" ` +
    `width="${ART_VIEWBOX}" height="${ART_VIEWBOX}" ` +
    `fill="none" stroke-linecap="${stroke.linecap}" stroke-linejoin="${stroke.linejoin}">` +
    `${titleTag}${inner}</svg>`
  );
}

/** Escape the five XML special characters for safe interpolation into markup. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Encode a finished SVG string as a base64 `data:` URI. Used by both the React
 * `<img>` adapter and the Phaser texture loader. Base64 (vs. URL-encoding)
 * keeps the string stable and is what `Phaser.Textures.addBase64` expects.
 */
export function svgToDataUri(svg: string): string {
  // `btoa` exists in browsers and Node ≥16 / jsdom. Encode UTF-8 first so
  // non-ASCII (Vietnamese titles) survive the latin1-only btoa.
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Register an SVG string as a Phaser texture (idempotent — safe to call every
 * scene create). Returns the texture key. Will be the workhorse for B3.
 *
 * @param size optional intrinsic pixel size hint baked into the data URI's
 *   `<img>` decode; the canonical viewBox makes the SVG scalable regardless.
 */
export function loadSvgTexture(scene: ArtScene, key: string, svg: string): string {
  if (!scene.textures.exists(key)) {
    scene.textures.addBase64(key, svgToDataUri(svg));
  }
  return key;
}

/**
 * Convenience: ensure the texture exists, then place it centred at (x, y),
 * displayed at `size`×`size` pixels. Returns the created image for chaining.
 */
export function addArt(
  scene: ArtScene,
  key: string,
  svg: string,
  x: number,
  y: number,
  size: number,
): ArtImage {
  loadSvgTexture(scene, key, svg);
  return scene.add.image(x, y, key).setOrigin(0.5).setDisplaySize(size, size);
}
