export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
  backgroundColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'sloth', emoji: '🦥', label: 'Sloth', backgroundColor: '#FFF3E6' },
  { id: 'fox', emoji: '🦊', label: 'Fox', backgroundColor: '#FFE8D6' },
  { id: 'owl', emoji: '🦉', label: 'Owl', backgroundColor: '#F0E6FF' },
  { id: 'cat', emoji: '🐱', label: 'Cat', backgroundColor: '#E6FFF0' },
  { id: 'bear', emoji: '🐻', label: 'Bear', backgroundColor: '#FFE6E6' },
  { id: 'bunny', emoji: '🐰', label: 'Bunny', backgroundColor: '#E6F0FF' },
  { id: 'panda', emoji: '🐼', label: 'Panda', backgroundColor: '#F5F5F5' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin', backgroundColor: '#E6FFFF' },
];
