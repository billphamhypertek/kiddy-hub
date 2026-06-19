import { useCallback, useMemo } from 'react';
import { GameContainer } from './components/GameContainer';
import { createAudioManager } from './audio/AudioManager';
import { createHowlerPlayer } from './audio/howlerPlayer';
import { AUDIO_MANIFEST } from './audio/audioManifest';
import { registerAllGames } from './games';

registerAllGames();

export default function App() {
  const audio = useMemo(
    () => createAudioManager(createHowlerPlayer(), AUDIO_MANIFEST),
    [],
  );
  const onExit = useCallback((r?: unknown) => {
    // eslint-disable-next-line no-console
    console.log('game exited with', r);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameContainer gameId="counting-fun" level={1} profileId={1} audio={audio} onExit={onExit} />
    </div>
  );
}
