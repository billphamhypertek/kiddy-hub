import { describe, it, expect, vi } from 'vitest';
import { createGameHost } from './GameHost';

describe('createGameHost', () => {
  it('routes speak/speakText/playSfx to the audio manager', () => {
    const audio = {
      speak: vi.fn().mockResolvedValue(undefined),
      speakText: vi.fn().mockResolvedValue(undefined),
      playSfx: vi.fn(),
    };
    const host = createGameHost({
      audio: audio as never,
      onAward: vi.fn(),
      onComplete: vi.fn(),
      onHome: vi.fn(),
    });
    host.speak('counting.prompt');
    host.speakText('seven', 'en-US');
    host.playSfx('tap');
    expect(audio.speak).toHaveBeenCalledWith('counting.prompt');
    expect(audio.speakText).toHaveBeenCalledWith('seven', 'en-US');
    expect(audio.playSfx).toHaveBeenCalledWith('tap');
  });

  it('routes awardStars/complete/goHome to the supplied callbacks', () => {
    const onAward = vi.fn();
    const onComplete = vi.fn();
    const onHome = vi.fn();
    const host = createGameHost({
      audio: { speak: vi.fn(), playSfx: vi.fn() } as never,
      onAward,
      onComplete,
      onHome,
    });
    host.awardStars(3);
    host.complete({ gameId: 'counting-fun', level: 1, score: 5, stars: 3 });
    host.goHome();
    expect(onAward).toHaveBeenCalledWith(3);
    expect(onComplete).toHaveBeenCalledWith({ gameId: 'counting-fun', level: 1, score: 5, stars: 3 });
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
