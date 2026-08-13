export type AuthorId = 'cappy' | 'shel';

/** Display names for the two mascots/personas. Shel has no avatar art yet
 * (in production) — bylines show the name as a text pill, no image, so
 * nothing breaks once the art is ready and gets wired in later. */
export const AUTHOR_NAMES: Record<AuthorId, string> = {
  cappy: 'Cappy',
  shel: 'Shel',
};
