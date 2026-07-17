export type Page =
  | { type: 'home' }
  | {
      type: 'settings';
      tab?: 'user-extension' | 'user-origin' | 'team' | 'default';
    };
