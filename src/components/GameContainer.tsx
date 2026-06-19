import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getGame } from '../games/registry';
import { createGameHost } from '../games/GameHost';
import type { AudioManager } from '../audio/AudioManager';
import type { GameResult } from '../games/GameModule';
import { recordPlay } from '../data/progress';
import { addStars } from '../data/stars';

interface GameContainerProps {
  gameId: string;
  level: number;
  profileId: number;
  audio: AudioManager;
  onExit: (result?: GameResult) => void;
}

export function GameContainer({ gameId, level, profileId, audio, onExit }: GameContainerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moduleDef = getGame(gameId);
    const parent = parentRef.current;
    if (!moduleDef || !parent) return;

    const host = createGameHost({
      audio,
      onAward: (n) => {
        void addStars(profileId, n); // awardStars persists immediately
      },
      onComplete: async (result: GameResult) => {
        // Auto-advance difficulty: a perfect session bumps the saved level
        // (capped at the game's max). recordPlay stores max(existing, level).
        const advance = result.stars >= 3 && result.level < moduleDef.levels;
        const newLevel = advance ? result.level + 1 : result.level;
        await recordPlay(profileId, result.gameId, newLevel, result.score);
        onExit(result); // stars already persisted via onAward
      },
      onHome: () => onExit(),
    });

    const scene = moduleDef.createScene(host, level);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 1024,
      height: 768,
      backgroundColor: '#dff3ff',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });

    return () => {
      game.destroy(true);
    };
  }, [gameId, level, profileId, audio, onExit]);

  return <div ref={parentRef} style={{ width: '100%', height: '100%' }} />;
}
