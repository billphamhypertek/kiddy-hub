import { describe, it, expect } from 'vitest';
import { AUDIO_MANIFEST } from './audioManifest';

const VALID_LANGS = ['vi-VN', 'en-US'];

describe('AUDIO_MANIFEST', () => {
  it('gives every voice key a non-empty text and a valid lang', () => {
    const entries = Object.entries(AUDIO_MANIFEST.voices);
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, entry] of entries) {
      expect(entry.text.trim(), `voice "${key}" text`).not.toBe('');
      expect(VALID_LANGS, `voice "${key}" lang`).toContain(entry.lang);
    }
  });

  it('declares the four core sfx names', () => {
    expect(AUDIO_MANIFEST.sfx).toEqual(
      expect.arrayContaining(['tap', 'correct', 'wrong', 'star']),
    );
  });
});
