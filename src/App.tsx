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
import type { CategoryId, Profile } from './data/types';
import type { GameResult } from './games/GameModule';
import { WhoIsPlaying } from './components/WhoIsPlaying';
import { AdventureMap } from './components/AdventureMap';
import { CategoryScreen } from './components/CategoryScreen';
import { StarGarden } from './components/StarGarden';
import { ParentGate } from './components/parent/ParentGate';
import { ParentArea } from './components/parent/ParentArea';
import { ScreenTransition, injectMotionTokens } from './motion';
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

  const refreshStars = useCallback(async () => {
    setTotalStars((await getGarden()).totalStars);
  }, []);

  useEffect(() => {
    void getSettings().then((s) => {
      audio.setSoundOn(s.soundOn);
      audio.setVoiceOn(s.voiceOn);
    });
    void refreshStars();
  }, [audio, refreshStars]);

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
      setScreen({ name: 'game', gameId, level: prog?.level ?? 1 });
    },
    [profile],
  );

  const onGameExit = useCallback(
    async (_result?: GameResult) => {
      await refreshStars();
      setScreen({ name: 'map' });
    },
    [refreshStars],
  );

  // `selectScreen` owns the routing branch (parentGate/parent before the
  // who/no-profile fallback) so it can be unit-tested in isolation. We then
  // render the matching view and wrap it once in <ScreenTransition> so
  // navigating between screens plays a short, reduced-motion-aware entrance.
  // `key` identifies the active screen so the transition replays on change.
  const { key: screenKey, kind } = selectScreen(screen, !!profile);
  let view: JSX.Element;

  switch (kind) {
    case 'parentGate':
      view = <ParentGate onPass={() => setScreen({ name: 'parent' })} />;
      break;
    case 'parent':
      view = (
        <ParentArea
          audio={audio}
          onExit={() => {
            void refreshStars();
            setScreen({ name: 'who' });
          }}
        />
      );
      break;
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
      view = <StarGarden onBack={() => setScreen({ name: 'map' })} />;
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
