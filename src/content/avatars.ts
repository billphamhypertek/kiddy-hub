export interface AvatarOption {
  key: string;
  emoji: string;
  label: string;
}

export const AVATARS: AvatarOption[] = [
  { key: 'cat', emoji: '🐱', label: 'Mèo' },
  { key: 'dog', emoji: '🐶', label: 'Cún' },
  { key: 'bear', emoji: '🐻', label: 'Gấu' },
  { key: 'rabbit', emoji: '🐰', label: 'Thỏ' },
  { key: 'fox', emoji: '🦊', label: 'Cáo' },
  { key: 'panda', emoji: '🐼', label: 'Trúc' },
  { key: 'lion', emoji: '🦁', label: 'Sư tử' },
  { key: 'frog', emoji: '🐸', label: 'Ếch' },
];

/** Vietnamese label for an avatar key — used as `alt`/accessible name for art. */
export function avatarLabel(key: string): string {
  return AVATARS.find((a) => a.key === key)?.label ?? 'Mèo';
}
