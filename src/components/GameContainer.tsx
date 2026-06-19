import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getGame } from '../games/registry';
import { createGameHost } from '../games/GameHost';
import type { AudioManager } from '../audio/AudioManager';
import type { GameResult } from '../games/GameModule';
import { recordPlay } from '../data/progress';
import { addStars } from '../data/stars';
import { applyCompletion } from '../games/applyCompletion';

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
        await applyCompletion({ profileId, maxLevels: moduleDef.levels, recordPlay }, result);
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
