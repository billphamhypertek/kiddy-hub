import type { CSSProperties } from 'react';
import { getGamesByCategory } from '../games/registry';
import { CATEGORIES } from '../content/categories';
import { SvgArt } from '../art/Art';
import { gameIcon } from '../art/gameIcons';
import { islandArt } from '../art/islands';
import { foxIdle } from '../art/fox';
import type { CategoryId } from '../data/types';
import type { IslandKey } from '../art/tokens';
import type { MenuAudio } from './menuAudio';

interface Props {
  categoryId: CategoryId;
  onPlay: (gameId: string) => void;
  onBack: () => void;
  audio?: MenuAudio;
}

export function CategoryScreen({ categoryId, onPlay, onBack, audio }: Props) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const games = getGamesByCategory(categoryId);

  const handlePlay = (id: string, title: string): void => {
    void audio?.speakText(title);
    onPlay(id);
  };

  return (
    <div className="screen category">
      <button className="back" aria-label="Quay lại bản đồ" onClick={onBack}>
        ⬅️
      </button>
      <h2>
        {category && (
          <SvgArt
            svg={islandArt(category.id as IslandKey, category.title)}
            alt=""
            size={40}
            className="category-icon"
          />
        )}{' '}
        {category?.title}
      </h2>
      {games.length === 0 ? (
        // Every category currently ships games, so this is rare; keep a gentle
        // Cáo + the clear ⬅️ back affordance above as the "next" out.
        <div className="category-empty">
          <SvgArt svg={foxIdle()} alt="" size={72} className="inline-fox" />
          <p className="hint">Sắp có trò chơi mới ở đây! Bấm ⬅️ để chọn đảo khác nhé.</p>
        </div>
      ) : (
        <div className="game-list">
          {games.map((g, i) => (
            <button
              key={g.id}
              className="game-card stagger-item"
              style={{ '--stagger-index': i } as CSSProperties}
              onClick={() => handlePlay(g.id, g.title)}
            >
              <SvgArt
                svg={gameIcon(g.id, g.title)}
                alt={g.title}
                size={72}
                className="game-icon"
              />
              <span className="game-title">{g.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
