import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Read the SHIPPED stylesheet so these assertions run against the exact CSS the
// app loads. (Node builtins are ambiently typed in src/vite-env.d.ts.)
const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './App.css'), 'utf-8');

describe('App.css — storybook surface (GĐ6.5)', () => {
  it('defines reusable storybook custom properties on :root', () => {
    expect(css).toMatch(/--sb-ink:\s*#6b4a2a/i); // outline.ink
    expect(css).toMatch(/--sb-shadow:/);
    expect(css).toMatch(/--sb-radius:/);
  });

  it('adds a cheap, behind-content, non-interactive paper-grain overlay', () => {
    expect(css).toMatch(/body::before/);
    const block = css.slice(css.indexOf('body::before'), css.indexOf('body::before') + 600);
    expect(block).toMatch(/pointer-events:\s*none/);
    expect(block).toMatch(/z-index:\s*-1/);
    expect(block).toMatch(/opacity:\s*var\(--sb-paper\)|opacity:\s*0?\.0[0-9]/); // ~5%
  });

  it('keeps warm cream as the page background and Baloo 2 first in the stack', () => {
    expect(css).toMatch(/#fef6ec/i); // palette.background warm cream
    expect(css).toMatch(/font-family:\s*'Baloo 2'/);
  });

  it('keeps every tap target generously sized (≥56px) for small fingers', () => {
    expect(css).toMatch(/\bbutton\s*\{[^}]*min-height:\s*(?:5[6-9]|[6-9]\d|\d{3})px/s);
    expect(css).toMatch(/\.switch-child-btn[^}]*min-height:\s*56px/s);
  });

  it('preserves calm-mode + reduced-motion animation kills', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/\.calm-mode \.screen-enter/);
  });

  it('preserves the colourblind-safe status badge shapes (icon+text+SHAPE, not colour)', () => {
    expect(css).toMatch(/\.status-mastered[^}]*border-radius:\s*999px/s); // pill
    expect(css).toMatch(/\.status-emerging[^}]*border:\s*2px dashed/s); // dashed
    expect(css).toMatch(/\.status-practice-next[^}]*border:\s*2px dotted/s); // dotted
  });
});

describe('App.css — painted buttons & cards (GĐ6.5)', () => {
  it('paints the base button with a soft warm shadow, thin ink outline, rounded radius', () => {
    const i = css.indexOf('\nbutton {');
    const block = css.slice(i, i + 600);
    expect(block).toMatch(/box-shadow:\s*var\(--sb-shadow/);
    expect(block).toMatch(/border:\s*var\(--sb-ink-w\)\s+solid\s+var\(--sb-ink\)/);
    expect(block).toMatch(/border-radius:/);
    expect(block).toMatch(/linear-gradient/); // gentle painted gradient
  });

  it('gives the avatar & game cards the painted card surface', () => {
    expect(css).toMatch(/\.avatar-card[^}]*var\(--sb-shadow/s);
    expect(css).toMatch(/\.game-card[^}]*var\(--sb-shadow/s);
  });
});
