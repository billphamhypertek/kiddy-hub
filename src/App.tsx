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
import './App.css';

registerAllGames();

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

  if (screen.name === 'who') {
    return (
      <WhoIsPlaying
        audio={audio}
        onSelect={selectProfile}
        onParent={() => setScreen({ name: 'parentGate' })}
      />
    );
  }
  if (screen.name === 'parentGate') {
    return <ParentGate onPass={() => setScreen({ name: 'parent' })} />;
  }
  if (screen.name === 'parent') {
    return (
      <ParentArea
        audio={audio}
        onExit={() => {
          void refreshStars();
          setScreen({ name: 'who' });
        }}
      />
    );
  }
  if (!profile) {
    return (
      <WhoIsPlaying
        audio={audio}
        onSelect={selectProfile}
        onParent={() => setScreen({ name: 'parentGate' })}
      />
    );
  }
  if (screen.name === 'map') {
    return (
      <AdventureMap
        profile={profile}
        totalStars={totalStars}
        onCategory={onCategory}
        onGarden={() => setScreen({ name: 'garden' })}
        audio={audio}
      />
    );
  }
  if (screen.name === 'category') {
    return (
      <CategoryScreen
        categoryId={screen.categoryId}
        onPlay={onPlay}
        onBack={() => setScreen({ name: 'map' })}
        audio={audio}
      />
    );
  }
  if (screen.name === 'garden') {
    return <StarGarden onBack={() => setScreen({ name: 'map' })} />;
  }
  // screen.name === 'game'
  return (
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
