import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { getGame } from '../games/registry';
import { createGameHost } from '../games/GameHost';
import type { AudioManager } from '../audio/AudioManager';
import type { GameResult } from '../games/GameModule';
import { recordPlay } from '../data/progress';
import { addStars } from '../data/stars';
import { applyCompletion } from '../games/applyCompletion';
import { createMasterySession } from '../games/masterySession';
import { loadMasteryMap, upsertMastery } from '../data/mastery';
import { SKILLS_FOR_GAME } from '../games/masteryMap';

interface GameContainerProps {
  gameId: string;
  level: number;
  profileId: number;
  audio: AudioManager;
  onExit: (result?: GameResult) => void;
}

export function GameContainer({ gameId, level, profileId, audio, onExit }: GameContainerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  // While true we show a brief loading card; the game's Scene chunk (and Phaser
  // on first open) is fetched dynamically via `moduleDef.loadScene()`.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const moduleDef = getGame(gameId);
    const parent = parentRef.current;
    if (!moduleDef || !parent) return;

    // Guards teardown: if this effect re-runs (or unmounts) before the async
    // scene factory resolves, we must not boot a Phaser game into a stale parent.
    let cancelled = false;
    let game: Phaser.Game | undefined;

    setLoading(true);

    // Load this game's spaced-repetition mastery rows ONCE (await BEFORE boot)
    // so the in-memory MasterySession exists when the scene first calls
    // pickItem/recordItemResult/hint. The scheduler/Leitner stay pure & sync.
    const skillIds = SKILLS_FOR_GAME[gameId] ?? [];

    void Promise.all([
      moduleDef.loadScene(),
      skillIds.length > 0 ? loadMasteryMap(profileId, skillIds) : Promise.resolve(undefined),
    ]).then(([createScene, rows]) => {
      if (cancelled) return;

      // No mastery skills (non-SR game) → no session; the host omits the SR
      // methods and the scene degrades to legacy behaviour gracefully.
      const session = rows
        ? createMasterySession({
            rows,
            now: Date.now,
            rng: Math.random,
            persist: (skillId, row) =>
              void upsertMastery(profileId, skillId, row).catch(() => {}),
          })
        : undefined;

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
        session,
      });

      const scene = createScene(host, level);
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: 1024,
        height: 768,
        backgroundColor: '#dff3ff',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [gameId, level, profileId, audio, onExit]);

  return (
    <div ref={parentRef} style={{ width: '100%', height: '100%' }}>
      {loading && <div className="game-loading">Đang tải trò chơi…</div>}
    </div>
  );
}
