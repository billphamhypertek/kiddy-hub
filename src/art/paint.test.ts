import { describe, it, expect } from 'vitest';
import { softShadow, paintedFill, inkStroke, paperGrain, withDefs } from './paint';
import { shadow, outline, paper, paint } from './tokens';

/**
 * GĐ6.1 — pure paint factory. Like every src/art/* string factory, the DRAWING
 * is manual-tested in the browser; here we only lock the pure contracts:
 *   - each factory returns valid, well-formed SVG <defs> fragments;
 *   - ids are NAMESPACED (the caller's id appears, so two assets on one page
 *     don't collide);
 *   - the storybook tokens are present with the expected keys.
 */
describe('storybook tokens', () => {
  it('exposes shadow/outline/paper/paint with the expected keys', () => {
    for (const k of ['color', 'dx', 'dy', 'blur', 'opacity']) expect(shadow).toHaveProperty(k);
    for (const k of ['ink', 'width', 'widthThin']) expect(outline).toHaveProperty(k);
    for (const k of ['baseFrequency', 'opacity']) expect(paper).toHaveProperty(k);
    for (const k of ['lighten', 'darken']) expect(paint).toHaveProperty(k);
  });
});

describe('softShadow', () => {
  it('returns a <filter> carrying the namespaced id and a feDropShadow', () => {
    const f = softShadow('fox-shadow');
    expect(f).toContain('<filter id="fox-shadow"');
    expect(f).toContain('feDropShadow');
    expect(f).toContain('</filter>');
  });
  it('namespaces the id so two filters never collide', () => {
    expect(softShadow('a')).toContain('id="a"');
    expect(softShadow('b')).toContain('id="b"');
    expect(softShadow('a')).not.toContain('id="b"');
  });
});

describe('paintedFill', () => {
  it('returns a vertical linearGradient with three stops, carrying the id', () => {
    const g = paintedFill('duck-fur', '#ff8c42');
    expect(g).toContain('<linearGradient id="duck-fur"');
    expect(g).toContain('</linearGradient>');
    expect((g.match(/<stop/g) ?? []).length).toBe(3);
    // The middle stop is the exact hue passed in.
    expect(g).toContain('#ff8c42');
    // Vertical (top→foot) gradient.
    expect(g).toContain('x1="0"');
    expect(g).toContain('y2="1"');
  });
  it('lightens the top stop and darkens the foot stop (depth)', () => {
    const g = paintedFill('x', '#808080');
    // top stop is lighter than #808080, foot is darker — both differ from mid.
    const stops = g.match(/stop-color="(#[0-9a-fA-F]{6})"/g) ?? [];
    expect(stops.length).toBe(3);
    expect(stops[0]).not.toBe('stop-color="#808080"');
    expect(stops[2]).not.toBe('stop-color="#808080"');
  });
});

describe('inkStroke', () => {
  it('returns stroke attributes using the storybook ink + round caps', () => {
    const s = inkStroke();
    expect(s).toContain(`stroke="${outline.ink}"`);
    expect(s).toContain('stroke-linecap="round"');
    expect(s).toContain('stroke-linejoin="round"');
  });
});

describe('paperGrain', () => {
  it('returns a <filter> with feTurbulence carrying the namespaced id', () => {
    const f = paperGrain('scene-grain');
    expect(f).toContain('<filter id="scene-grain"');
    expect(f).toContain('feTurbulence');
    expect(f).toContain('</filter>');
  });
});

describe('withDefs', () => {
  it('wraps the defs in a <defs> block before the body', () => {
    const out = withDefs('<filter/>', '<rect/>');
    expect(out).toBe('<defs><filter/></defs><rect/>');
  });
});
