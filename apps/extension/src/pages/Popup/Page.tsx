export type Page =
  | { type: 'home' }
  | { type: 'edit-controls' }
  | { type: 'share'; media: string };
