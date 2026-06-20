import { useCallback, useEffect, useMemo, useState } from 'react';
import { SessionProvider, useSession } from './state/SessionContext';
import type { Screen } from './state/screens';
import { createAudioManager, type AudioManager } from './audio/AudioManager';
import { createWebSpeechEngine } from './audio/speechEngine';
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
import { GameContainer } from './components/GameContainer';
import { ParentGate } from './components/parent/ParentGate';
import { ParentArea } from './components/parent/ParentArea';
import { ScreenTransition, injectMotionTokens } from './motion';
import './App.css';

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

  // Each branch produces the active view; we wrap it once in <ScreenTransition>
  // so navigating between screens plays a short, reduced-motion-aware entrance.
  // `screenKey` identifies the active screen so the transition replays on change.
  let view: JSX.Element;
  let screenKey: string;

  // NOTE: parentGate/parent MUST be checked before the `who || !profile` fallback.
  // `profile` is null while on the parent gate (it's only set by selectProfile,
  // which also navigates away), so putting `!profile` first would swallow these
  // two screens and make the Parent Area unreachable.
  if (screen.name === 'parentGate') {
    screenKey = 'parentGate';
    view = <ParentGate onPass={() => setScreen({ name: 'parent' })} />;
  } else if (screen.name === 'parent') {
    screenKey = 'parent';
    view = (
      <ParentArea
        audio={audio}
        onExit={() => {
          void refreshStars();
          setScreen({ name: 'who' });
        }}
      />
    );
  } else if (screen.name === 'who' || !profile) {
    screenKey = 'who';
    view = (
      <WhoIsPlaying
        audio={audio}
        onSelect={selectProfile}
        onParent={() => setScreen({ name: 'parentGate' })}
      />
    );
  } else if (screen.name === 'map') {
    screenKey = 'map';
    view = (
      <AdventureMap
        profile={profile}
        totalStars={totalStars}
        onCategory={onCategory}
        onGarden={() => setScreen({ name: 'garden' })}
        audio={audio}
      />
    );
  } else if (screen.name === 'category') {
    screenKey = `category:${screen.categoryId}`;
    view = (
      <CategoryScreen
        categoryId={screen.categoryId}
        onPlay={onPlay}
        onBack={() => setScreen({ name: 'map' })}
        audio={audio}
      />
    );
  } else if (screen.name === 'garden') {
    screenKey = 'garden';
    view = <StarGarden onBack={() => setScreen({ name: 'map' })} />;
  } else {
    // screen.name === 'game'
    screenKey = `game:${screen.gameId}`;
    view = (
      <div className="game-screen">
        <GameContainer
          gameId={screen.gameId}
          level={screen.level}
          profileId={profile.id!}
          audio={audio}
          onExit={onGameExit}
        />
      </div>
    );
  }

  return <ScreenTransition screenKey={screenKey}>{view}</ScreenTransition>;
}

export default function App() {
  const audio = useMemo(
    () => createAudioManager(createWebSpeechEngine(), createWebAudioSfxEngine(), AUDIO_MANIFEST),
    [],
  );
  return (
    <SessionProvider>
      <Root audio={audio} />
    </SessionProvider>
  );
}
