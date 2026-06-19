import Dexie, { type Table } from 'dexie';
import type { Profile, Progress, StarEvent, Garden, Settings } from './types';

export class KiddyHubDB extends Dexie {
  profiles!: Table<Profile, number>;
  progress!: Table<Progress, number>;
  starEvents!: Table<StarEvent, number>;
  garden!: Table<Garden, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('kiddyhub');
    this.version(1).stores({
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
    });
  }
}

export const db = new KiddyHubDB();
