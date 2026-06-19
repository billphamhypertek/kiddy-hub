import type { CategoryId } from '../data/types';

export type Screen =
  | { name: 'who' }
  | { name: 'map' }
  | { name: 'category'; categoryId: CategoryId }
  | { name: 'game'; gameId: string; level: number }
  | { name: 'garden' }
  | { name: 'parentGate' }
  | { name: 'parent' };
