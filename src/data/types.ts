export type CategoryId = 'numbers' | 'letters' | 'logic' | 'memory' | 'shapes' | 'english';

export interface Profile {
  id?: number;
  name: string;
  avatarKey: string;
  birthYear?: number;
  createdAt: number;
}

export interface Progress {
  id?: number;
  profileId: number;
  gameId: string;
  level: number;
  bestScore: number;
  timesPlayed: number;
  lastPlayedAt: number;
}

export interface StarEvent {
  id?: number;
  profileId: number;
  amount: number;
  earnedAt: number;
  weekKey: string;
}

export interface Garden {
  id: 'family';
  totalStars: number;
  grownItems: string[];
}

export interface Settings {
  id: 'app';
  soundOn: boolean;
  voiceOn: boolean;
  language: 'vi' | 'en';
}
