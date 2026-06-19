import type { AudioManager } from '../audio/AudioManager';

/**
 * The slice of AudioManager the menu screens need. Kept narrow so menus depend
 * only on speaking, and so tests can pass a tiny stub (or nothing — the prop is
 * optional everywhere it is used).
 */
export type MenuAudio = Pick<AudioManager, 'speak' | 'speakText'>;
