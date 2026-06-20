import { describe, it, expect } from 'vitest';
import { svgDoc, svgToDataUri, escapeXml, loadSvgTexture, addArt, type ArtScene } from './svg';
import { palette, fox, stroke, radius, proportion, ART_VIEWBOX } from './tokens';
import { foxGuide, foxCheer, foxIdle, foxPoses } from './fox';

/** Decode the base64 payload of a data URI back to its UTF-8 source. */
function decodeDataUri(uri: string): string {
  return decodeURIComponent(escape(atob(uri.split(',')[1])));
}

describe('svgToDataUri', () => {
  it('produces a valid base64 SVG data URI', () => {
    const uri = svgToDataUri(foxIdle());
    expect(uri).toMatch(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/);
    // round-trips back to the original markup
    const decoded = decodeDataUri(uri);
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('</svg>');
  });

  it('encodes non-ASCII (Vietnamese title) without throwing', () => {
    const uri = svgToDataUri(svgDoc('<rect/>', 'Cáo dẫn đường'));
    expect(decodeDataUri(uri)).toContain('Cáo dẫn đường');
  });
});

describe('svgDoc', () => {
  it('wraps inner markup in a viewBox-correct svg with an accessible title', () => {
    const doc = svgDoc('<circle/>', 'Hi & <bye>');
    expect(doc).toContain(`viewBox="0 0 ${ART_VIEWBOX} ${ART_VIEWBOX}"`);
    expect(doc).toContain('<title>Hi &amp; &lt;bye&gt;</title>');
    expect(doc.startsWith('<svg')).toBe(true);
    expect(doc.endsWith('</svg>')).toBe(true);
  });
});

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &apos;');
  });
});

describe('tokens', () => {
  it('exposes the expected style-bible keys', () => {
    for (const key of ['primary', 'accent', 'background', 'ink', 'star', 'success', 'error']) {
      expect(palette).toHaveProperty(key);
    }
    for (const key of ['body', 'cream', 'ink', 'blush']) {
      expect(fox).toHaveProperty(key);
    }
    expect(stroke).toHaveProperty('width');
    expect(radius).toHaveProperty('md');
    expect(proportion).toHaveProperty('eyeRatio');
  });

  it('keeps island hues in sync with the category palette', () => {
    expect(palette.island).toMatchObject({
      numbers: '#ff8fab',
      letters: '#7cc6fe',
      logic: '#ffb703',
      memory: '#b388ff',
      shapes: '#06d6a0',
      english: '#ff7043',
    });
  });
});

describe('fox poses', () => {
  it('every pose returns a complete svg document', () => {
    for (const make of [foxGuide, foxCheer, foxIdle]) {
      const svg = make();
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
    }
    expect(Object.keys(foxPoses)).toEqual(['guide', 'cheer', 'idle']);
  });
});

describe('phaser adapters', () => {
  function fakeScene(): { scene: ArtScene; added: string[]; registered: string[] } {
    const registered: string[] = [];
    const added: string[] = [];
    const scene: ArtScene = {
      textures: {
        exists: (k) => registered.includes(k),
        addBase64: (k) => registered.push(k),
      },
      add: {
        image: (_x, _y, k) => {
          added.push(k);
          return {
            setDisplaySize() {
              return this;
            },
            setOrigin() {
              return this;
            },
          };
        },
      },
    };
    return { scene, added, registered };
  }

  it('loadSvgTexture registers once and is idempotent', () => {
    const { scene, registered } = fakeScene();
    loadSvgTexture(scene, 'fox-idle', foxIdle());
    loadSvgTexture(scene, 'fox-idle', foxIdle());
    expect(registered).toEqual(['fox-idle']);
  });

  it('addArt registers the texture and adds an image', () => {
    const { scene, added, registered } = fakeScene();
    addArt(scene, 'fox-cheer', foxCheer(), 10, 20, 64);
    expect(registered).toContain('fox-cheer');
    expect(added).toEqual(['fox-cheer']);
  });
});
