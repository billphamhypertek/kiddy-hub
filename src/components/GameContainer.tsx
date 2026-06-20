import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { getGame } from '../games/registry';
import { createGameHost } from '../games/GameHost';
import type { AudioManager } from '../audio/AudioManager';
import type { GameResult } from '../games/GameModule';
import { recordPlay } from '../data/progress';
import { addStars, syncGardenMastery } from '../data/stars';
import { applyCompletion } from '../games/applyCompletion';
import { createMasterySession } from '../games/masterySession';
import { loadMasteryMap, upsertMastery, getMasterySummary } from '../data/mastery';
import { syncCollection } from '../data/collection';
import { SKILLS_FOR_GAME } from '../games/masteryMap';
import { bridgeForGame, shouldShowBridge, type BridgeLine } from '../content/realWorldBridge';
import { RealWorldBridgeOverlay } from './RealWorldBridgeOverlay';
import { SvgArt } from '../art/Art';
import { foxIdle } from '../art/fox';

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
  // Set when the scene chunk (or mastery rows) fail to load. Without this the
  // loading card hung forever on a failed dynamic import (D1 bug #4).
  const [error, setError] = useState(false);
  // Bumping this re-runs the boot effect — used by the "Thử lại" button.
  const [retry, setRetry] = useState(0);
  // Real-world bridge overlay (D2 §8): set AFTER a round completes (round/level
  // already chốt, stars persisted) for ~1/3 of rounds. Holds the result so the
  // "Xong/Tiếp" button can finish the exit the completion handler deferred.
  const [bridge, setBridge] = useState<{ line: BridgeLine; result?: GameResult } | null>(null);

  const moduleDef = getGame(gameId);
  const gameTitle = moduleDef?.title ?? 'trò chơi';

  useEffect(() => {
    const parent = parentRef.current;
    if (!moduleDef || !parent) return;

    // Guards teardown: if this effect re-runs (or unmounts) before the async
    // scene factory resolves, we must not boot a Phaser game into a stale parent.
    let cancelled = false;
    let game: Phaser.Game | undefined;

    setLoading(true);
    setError(false);

    // Load this game's spaced-repetition mastery rows ONCE (await BEFORE boot)
    // so the in-memory MasterySession exists when the scene first calls
    // pickItem/recordItemResult/hint. The scheduler/Leitner stay pure & sync.
    const skillIds = SKILLS_FOR_GAME[gameId] ?? [];

    void Promise.all([
      moduleDef.loadScene(),
      skillIds.length > 0 ? loadMasteryMap(profileId, skillIds) : Promise.resolve(undefined),
    ])
      .then(([createScene, rows]) => {
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
            // Round/level is now chốt (stars persisted via onAward). OUTSIDE the
            // round lifecycle we (a) fold mastery into the family garden + the
            // child's sticker-book (additive), then (b) MAYBE show the gentle
            // real-world bridge overlay (~1/3). Failures here never block exit.
            try {
              const summary = await getMasterySummary(profileId);
              const totalMastered = summary.reduce((n, s) => n + s.mastered.length, 0);
              await syncGardenMastery(totalMastered);
              await syncCollection(profileId, summary);
            } catch {
              /* enrichment is best-effort; never block the child's return */
            }
            if (cancelled) return;
            if (shouldShowBridge(Math.random)) {
              // Defer onExit to the overlay's "Xong/Tiếp" button.
              setBridge({ line: bridgeForGame(gameId), result });
            } else {
              onExit(result); // stars already persisted via onAward
            }
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
      })
      // A failed scene-chunk (or mastery) load used to hang the loading card
      // forever. Surface a recoverable error instead — "Thử lại" / "Về bản đồ".
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError(true);
      });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
    // `retry` is a deliberate dependency so "Thử lại" re-runs the boot.
  }, [gameId, level, profileId, audio, onExit, moduleDef, retry]);

  // Cáo voices the bridge invite once when the overlay appears (gated on
  // voiceOn inside AudioManager — silent fox if voice is off, still usable).
  useEffect(() => {
    if (bridge) void audio.speak(bridge.line.voiceKey);
  }, [bridge, audio]);

  const finishBridge = (): void => {
    const result = bridge?.result;
    setBridge(null);
    onExit(result);
  };

  return (
    <div ref={parentRef} style={{ width: '100%', height: '100%' }}>
      {error ? (
        <div className="game-loading game-error" role="alert">
          <SvgArt svg={foxIdle()} alt="" size={72} className="loading-fox" />
          <p className="game-error-msg">Ôi, trò chơi chưa mở được.</p>
          <div className="game-error-actions">
            <button className="game-error-retry" onClick={() => setRetry((n) => n + 1)}>
              Thử lại
            </button>
            <button className="game-error-home" onClick={() => onExit()}>
              Về bản đồ
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="game-loading" aria-live="polite">
          <SvgArt svg={foxIdle()} alt="" size={72} className="loading-fox" />
          <p className="game-loading-msg">Đang mở {gameTitle}…</p>
        </div>
      ) : null}
      {bridge && <RealWorldBridgeOverlay line={bridge.line} onContinue={finishBridge} />}
    </div>
  );
}
