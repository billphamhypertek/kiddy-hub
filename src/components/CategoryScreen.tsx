import { getGamesByCategory } from '../games/registry';
import { CATEGORIES } from '../content/categories';
import type { CategoryId } from '../data/types';

interface Props {
  categoryId: CategoryId;
  onPlay: (gameId: string) => void;
  onBack: () => void;
}

export function CategoryScreen({ categoryId, onPlay, onBack }: Props) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const games = getGamesByCategory(categoryId);

  return (
    <div className="screen category">
      <button className="back" aria-label="Quay lại bản đồ" onClick={onBack}>
        ⬅️
      </button>
      <h2>
        {category?.icon} {category?.title}
      </h2>
      {games.length === 0 ? (
        <p className="hint">Sắp có trò chơi mới ở đây! 🦊</p>
      ) : (
        <div className="game-list">
          {games.map((g) => (
            <button key={g.id} className="game-card" onClick={() => onPlay(g.id)}>
              <span className="game-icon">{g.iconKey}</span>
              <span className="game-title">{g.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
