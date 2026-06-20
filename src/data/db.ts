import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  Progress,
  StarEvent,
  Garden,
  Settings,
  ItemMastery,
  CollectionSticker,
} from './types';

export class KiddyHubDB extends Dexie {
  profiles!: Table<Profile, number>;
  progress!: Table<Progress, number>;
  starEvents!: Table<StarEvent, number>;
  garden!: Table<Garden, string>;
  settings!: Table<Settings, string>;
  itemMastery!: Table<ItemMastery, number>;
  collection!: Table<CollectionSticker, number>;

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
    // GĐ5 D2 — ADDITIVE bump: re-declare every v2 table verbatim (Dexie requires
    // listing carried-over tables) + the new per-child sticker `collection`. No
    // PK/index change to old tables → no migration, no data loss.
    this.version(3).stores({
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
      itemMastery:
        '++id, profileId, [profileId+skillId], [profileId+skillId+itemKey], [profileId+dueAt]',
      // new: per-child earned stickers. PK ++id; compound index for upsert/read
      // of one sticker per child (≤ ~12 rows/child).
      collection: '++id, profileId, [profileId+stickerId]',
    });
  }
}

export const db = new KiddyHubDB();
