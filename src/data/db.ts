import Dexie, { type Table } from 'dexie';
import type { Profile, Progress, StarEvent, Garden, Settings, ItemMastery } from './types';

export class KiddyHubDB extends Dexie {
  profiles!: Table<Profile, number>;
  progress!: Table<Progress, number>;
  starEvents!: Table<StarEvent, number>;
  garden!: Table<Garden, string>;
  settings!: Table<Settings, string>;
  itemMastery!: Table<ItemMastery, number>;

  constructor() {
    super('kiddyhub');
    this.version(1).stores({
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
    });
    this.version(2).stores({
      // bảng cũ giữ NGUYÊN khai báo (Dexie cần liệt kê lại) — không đổi PK/index
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
      // bảng mới: PK ++id; index phục vụ 3 truy vấn nóng
      itemMastery:
        '++id, profileId, [profileId+skillId], [profileId+skillId+itemKey], [profileId+dueAt]',
    });
  }
}

export const db = new KiddyHubDB();
