import type { CategoryId } from '../data/types';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  color: string;
  /** Island position on the adventure map, in percent of the map area. */
  islandPos: { x: number; y: number };
}

export const CATEGORIES: Category[] = [
  { id: 'numbers', title: 'Toán & Con số', icon: '🔢', color: '#ff8fab', islandPos: { x: 18, y: 22 } },
  { id: 'letters', title: 'Chữ cái', icon: '🔤', color: '#7cc6fe', islandPos: { x: 60, y: 14 } },
  { id: 'logic', title: 'Giải đố', icon: '🧩', color: '#ffb703', islandPos: { x: 34, y: 50 } },
  { id: 'memory', title: 'Trí nhớ', icon: '🧠', color: '#b388ff', islandPos: { x: 70, y: 48 } },
  { id: 'shapes', title: 'Hình & Màu', icon: '🎨', color: '#06d6a0', islandPos: { x: 20, y: 76 } },
  { id: 'english', title: 'Tiếng Anh', icon: '🌎', color: '#ff7043', islandPos: { x: 64, y: 78 } },
];
