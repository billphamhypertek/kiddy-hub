import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { SessionProvider, useSession } from './state/SessionContext';
import type { Screen } from './state/screens';
import { selectScreen } from './state/selectScreen';
import { createAudioManager, type AudioManager } from './audio/AudioManager';
import { createWebSpeechEngine } from './audio/speechEngine';
import { createPrerecordedEngine } from './audio/prerecordedEngine';
import { VOICE_CLIPS } from './audio/voiceClips';
import { createWebAudioSfxEngine } from './audio/sfxEngine';
import { AUDIO_MANIFEST } from './audio/audioManifest';
import { registerAllGames } from './games';
import { getSettings } from './data/settings';
import { getGarden } from './data/stars';
import { getProgress } from './data/progress';
import { listProfiles, getProfile } from './data/profiles';
import { getDueItems, getMasterySummary } from './data/mastery';
import { pickTodaysAdventure, getRecentGameIds, type AdventurePick } from './data/todaysAdventure';
import { allGames } from './games/registry';
import type { CategoryId, Profile } from './data/types';
import type { GameResult } from './games/GameModule';
import { WhoIsPlaying } from './components/WhoIsPlaying';
import { Onboarding } from './components/Onboarding';
import { AdventureMap } from './components/AdventureMap';
import { CategoryScreen } from './components/CategoryScreen';
import { StarGarden } from './components/StarGarden';
import { ParentGate } from './components/parent/ParentGate';
import { ParentArea } from './components/parent/ParentArea';
import { ScreenTransition, injectMotionTokens, setCalmMode, usePrefersReducedMotion } from './motion';
import './App.css';

// Lazy-loaded so the React side of the Phaser boundary is code-split too: the
// menu graph never statically imports GameContainer (which imports Phaser), so
// Phaser + the game scenes stay out of the initial bundle and load only when a
// child opens a game.
const GameContainer = lazy(() =>
  import('./components/GameContainer').then((m) => ({ default: m.GameContainer })),
);

registerAllGames();
// Expose the shared motion tokens to CSS (var(--motion-*)). Idempotent.
injectMotionTokens();

function Root({ audio }: { audio: AudioManager }) {
  const { profile, setProfile } = useSession();
  const [screen, setScreen] = useState<Screen>({ name: 'who' });
  const [totalStars, setTotalStars] = useState(0);
  // How many child profiles exist — drives first-run onboarding (D1 §4). Kept
  // in sync whenever the profile set can change (mount, parent-area exit).
  const [profileCount, setProfileCount] = useState(0);
  // "Cuộc phiêu lưu hôm nay" picks (D2 §5) — recomputed FRESH each time we land
  // on the map (no persisted "day" state, no streak). Curated read-only from B.
  const [adventurePicks, setAdventurePicks] = useState<AdventurePick[]>([]);

  const refreshStars = useCallback(async () => {
    setTotalStars((await getGarden()).totalStars);
  }, []);

  // Compute today's adventure for the active child. Pure picker fed by B's
  // due-items + the child's recent plays; FRESH each call (decision #1).
  const refreshAdventure = useCallback(async (profileId: number) => {
    const [dueItems, summary, recentGameIds] = await Promise.all([
      getDueItems(profileId, Date.now()),
      getMasterySummary(profileId),
      getRecentGameIds(profileId, 6),
    ]);
    setAdventurePicks(
      pickTodaysAdventure({
        dueItems,
        summary,
        recentGameIds,
        allGames: allGames(),
        rng: Math.random,
      }),
    );
  }, []);

  const refreshProfileCount = useCallback(async () => {
    setProfileCount((await listProfiles()).length);
  }, []);

  useEffect(() => {
    void getSettings().then((s) => {
      audio.setSoundOn(s.soundOn);
      audio.setVoiceOn(s.voiceOn);
      // Seed the calm-mode mirror from the persisted setting at mount so Phaser +
      // React read the right value from the first frame (and it survives reload).
      setCalmMode(s.calmMode);
    });
    void refreshStars();
    void refreshProfileCount();
  }, [audio, refreshStars, refreshProfileCount]);

  // Drive a `.calm-mode` class on the document root so CSS can disable
  // entrance/stagger animations when reduced motion is in effect (mirrors the
  // `@media (prefers-reduced-motion)` rules — applying the class under OS-reduce
  // is a harmless no-op since the media query already covers that case).
  // `usePrefersReducedMotion()` ORs calm with the OS preference and live-updates
  // via the calm-mode pub-sub, so the parent-area toggle applies instantly.
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('calm-mode', reducedMotion);
  }, [reducedMotion]);

  // Recompute today's adventure each time the map is shown for a child (FRESH;
  // no day-state). Cleared whenever we're off the map (or the active child
  // changes) so child A's picks never flash on child B's map mid-switch.
  useEffect(() => {
    if (screen.name === 'map' && profile?.id) {
      void refreshAdventure(profile.id);
    } else {
      setAdventurePicks([]);
    }
  }, [screen.name, profile?.id, refreshAdventure]);

  const selectProfile = useCallback(
    (p: Profile) => {
      setProfile(p);
      setScreen({ name: 'map' });
    },
    [setProfile],
  );

  const onCategory = useCallback((categoryId: CategoryId) => {
    setScreen({ name: 'category', categoryId });
  }, []);

  const onPlay = useCallback(
    async (gameId: string) => {
      if (!profile?.id) return;
      const prog = await getProgress(profile.id, gameId);
      setScreen({ name: 'game', gameId, level: prog?.level ?? 1, from: 'category' });
    },
    [profile],
  );

  // Launch a "phiêu lưu hôm nay" suggestion (D2 §5). Same as onPlay but tagged
  // from:'adventure' (D1's deep-link tag) for the transition/return semantics.
  const onPlayPick = useCallback(
    async (gameId: string) => {
      if (!profile?.id) return;
      const prog = await getProgress(profile.id, gameId);
      setScreen({ name: 'game', gameId, level: prog?.level ?? 1, from: 'adventure' });
    },
    [profile],
  );

  // Deep-link "Luyện tiếp" from the parent area (D1 §9). The card carries the
  // child's id, so we switch the active profile to that child, then route to the
  // game (tagged `from:'parent'`). The "which screen" decision still lives in
  // `selectScreen`; this is only a thin wire (set profile + set screen).
  const onPlayGame = useCallback(
    async (gameId: string, profileId: number) => {
      const child = await getProfile(profileId);
      if (!child) return;
      setProfile(child);
      const prog = await getProgress(profileId, gameId);
      setScreen({ name: 'game', gameId, level: prog?.level ?? 1, from: 'parent' });
    },
    [setProfile],
  );

  const onGameExit = useCallback(
    async (_result?: GameResult) => {
      await refreshStars();
      // Always return to the map: the child is now the active profile, so this
      // is sensible whether the game was opened from a category or deep-linked
      // from the parent area (we don't push a child back through the gate).
      setScreen({ name: 'map' });
    },
    [refreshStars],
  );

  // `selectScreen` owns the routing branch (parentGate/parent before the
  // who/no-profile fallback) so it can be unit-tested in isolation. We then
  // render the matching view and wrap it once in <ScreenTransition> so
  // navigating between screens plays a short, reduced-motion-aware entrance.
  // `key` identifies the active screen so the transition replays on change.
  const { key: screenKey, kind } = selectScreen(screen, !!profile, profileCount > 0);
  let view: JSX.Element;

  switch (kind) {
    case 'parentGate':
      view = <ParentGate onPass={() => setScreen({ name: 'parent' })} />;
      break;
    case 'parent':
      view = (
        <ParentArea
          audio={audio}
          onPlayGame={onPlayGame}
          onExit={() => {
            void refreshStars();
            // A profile may have been created/deleted in the parent area, so
            // re-derive the count: this drives whether `who` shows onboarding.
            void refreshProfileCount();
            setScreen({ name: 'who' });
          }}
        />
      );
      break;
    case 'onboarding': {
      const step =
        screen.name === 'onboarding'
          ? (screen as Extract<Screen, { name: 'onboarding' }>).step
          : 'welcome';
      view = (
        <Onboarding
          step={step}
          audio={audio}
          // Lead the parent INTO the existing arithmetic gate → profile
          // creation, exactly like the manual path — onboarding does not bypass
          // the gate. On gate pass they create the first child in ParentArea;
          // exiting refreshes the count and lands on `who` to pick the avatar.
          onStart={() => setScreen({ name: 'parentGate' })}
        />
      );
      break;
    }
    case 'who':
      view = (
        <WhoIsPlaying
          audio={audio}
          onSelect={selectProfile}
          onParent={() => setScreen({ name: 'parentGate' })}
        />
      );
      break;
    case 'map':
      view = (
        <AdventureMap
          profile={profile!}
          totalStars={totalStars}
          onCategory={onCategory}
          onGarden={() => setScreen({ name: 'garden' })}
          onSwitchChild={() => setScreen({ name: 'who' })}
          adventurePicks={adventurePicks}
          onPlayPick={onPlayPick}
          audio={audio}
        />
      );
      break;
    case 'category':
      view = (
        <CategoryScreen
          categoryId={(screen as Extract<Screen, { name: 'category' }>).categoryId}
          onPlay={onPlay}
          onBack={() => setScreen({ name: 'map' })}
          audio={audio}
        />
      );
      break;
    case 'garden':
      view = (
        <StarGarden
          onBack={() => setScreen({ name: 'map' })}
          profile={profile ?? undefined}
          audio={audio}
        />
      );
      break;
    case 'game': {
      const gameScreen = screen as Extract<Screen, { name: 'game' }>;
      view = (
        <div className="game-screen">
          <Suspense fallback={<div className="game-loading">Đang tải trò chơi…</div>}>
            <GameContainer
              gameId={gameScreen.gameId}
              level={gameScreen.level}
              profileId={profile!.id!}
              audio={audio}
              onExit={onGameExit}
            />
          </Suspense>
        </div>
      );
      break;
    }
  }

  return <ScreenTransition screenKey={screenKey}>{view}</ScreenTransition>;
}

export default function App() {
  const audio = useMemo(
    () =>
      createAudioManager(
        // Pre-recorded Piper clips first; Web Speech stays as the fallback for
        // unbounded content (child names) and anything without a bundled clip.
        createPrerecordedEngine(VOICE_CLIPS, createWebSpeechEngine()),
        createWebAudioSfxEngine(),
        AUDIO_MANIFEST,
      ),
    [],
  );
  return (
    <SessionProvider>
      <Root audio={audio} />
    </SessionProvider>
  );
}
