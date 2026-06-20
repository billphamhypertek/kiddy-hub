/**
 * KiddyHub — React adapter for SVG art (Giai đoạn 4 · Phần B1).
 *
 * Renders an in-code SVG string as an accessible <img>. We use <img src=dataUri>
 * (rather than dangerouslySetInnerHTML) so the same string path is shared with
 * Phaser (which also consumes the data URI), and so each asset gets a clean,
 * cacheable, decoded image with proper alt semantics.
 */
import { useMemo } from 'react';
import { svgToDataUri } from './svg';

export interface SvgArtProps {
  /** A complete `<svg>…</svg>` document string (e.g. from `foxGuide()`). */
  svg: string;
  /** Accessible name. Omit (or pass '') to render the image decorative. */
  alt?: string;
  /** Rendered square size in px. Defaults to 64. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Drop-in `<img>` that displays an SVG art string.
 * - With `alt`: announced to screen readers.
 * - Without `alt` (or `alt=""`): rendered decorative — an empty-`alt` img is
 *   already out of the accessibility tree, so no `aria-hidden` is needed.
 */
export function SvgArt({ svg, alt, size = 64, className, style }: SvgArtProps): JSX.Element {
  const src = useMemo(() => svgToDataUri(svg), [svg]);
  return (
    <img
      src={src}
      alt={alt ?? ''}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={style}
    />
  );
}
